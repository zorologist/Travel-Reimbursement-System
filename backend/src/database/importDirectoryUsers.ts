import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";

import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

const JOB_LEVELS = new Set([
  "Chairman", "Deputy", "Advisor", "Expert", "Assistant",
  "Deputy Assistant", "General Manager", "Assistant General Manager",
  "Level 1", "Level 2", "Level 3",
]);
const ROLES = new Set(["employee", "manager", "pr", "transportation", "timing", "salary"]);
const REQUIRED_HEADERS = [
  "windows_username", "user_principal_name", "employee_number", "display_name",
  "email", "department", "job_level", "roles", "active",
] as const;

interface ImportedUser {
  windowsUsername: string;
  userPrincipalName: string;
  employeeNumber: string;
  displayName: string;
  email: string;
  department: string;
  jobLevel: string;
  roles: string[];
  active: boolean;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function required(value: string | undefined, field: string, line: number): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new Error(`Line ${line}: ${field} is required.`);
  return normalized;
}

function parseUsers(text: string): ImportedUser[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV must contain a header and at least one employee.");
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) throw new Error(`CSV is missing required header: ${header}.`);
  }
  const indexOf = (header: typeof REQUIRED_HEADERS[number]) => headers.indexOf(header);
  const seenEmployees = new Set<string>();
  const seenWindowsUsers = new Set<string>();
  const seenUpns = new Set<string>();
  return rows.slice(1).map((fields, rowIndex) => {
    const line = rowIndex + 2;
    const get = (header: typeof REQUIRED_HEADERS[number]) => fields[indexOf(header)] ?? "";
    const employeeNumber = required(get("employee_number"), "employee_number", line).toUpperCase();
    const windowsUsername = required(get("windows_username"), "windows_username", line);
    const userPrincipalName = get("user_principal_name").trim();
    const jobLevel = required(get("job_level"), "job_level", line);
    const roles = required(get("roles"), "roles", line)
      .split("|").map((role) => role.trim().toLowerCase()).filter(Boolean);
    const activeText = required(get("active"), "active", line).toLowerCase();
    if (!JOB_LEVELS.has(jobLevel)) throw new Error(`Line ${line}: invalid job_level '${jobLevel}'.`);
    if (roles.length === 0 || roles.some((role) => !ROLES.has(role))) {
      throw new Error(`Line ${line}: roles must use employee|manager|pr|transportation|timing|salary.`);
    }
    if (!roles.includes("employee")) roles.unshift("employee");
    if (!["true", "false"].includes(activeText)) {
      throw new Error(`Line ${line}: active must be true or false.`);
    }
    const employeeKey = employeeNumber.toUpperCase();
    const windowsKey = windowsUsername.toUpperCase();
    const upnKey = userPrincipalName.toUpperCase();
    if (seenEmployees.has(employeeKey)) throw new Error(`Line ${line}: duplicate employee_number '${employeeNumber}'.`);
    if (seenWindowsUsers.has(windowsKey)) throw new Error(`Line ${line}: duplicate windows_username '${windowsUsername}'.`);
    if (upnKey && seenUpns.has(upnKey)) throw new Error(`Line ${line}: duplicate user_principal_name '${userPrincipalName}'.`);
    seenEmployees.add(employeeKey);
    seenWindowsUsers.add(windowsKey);
    if (upnKey) seenUpns.add(upnKey);
    return {
      windowsUsername,
      userPrincipalName,
      employeeNumber,
      displayName: required(get("display_name"), "display_name", line),
      email: get("email").trim(),
      department: required(get("department"), "department", line),
      jobLevel,
      roles: [...new Set(roles)],
      active: activeText === "true",
    };
  });
}

async function applyUsers(client: PoolClient, users: ImportedUser[], disableMissing: boolean): Promise<void> {
  for (const user of users) {
    const existing = await client.query(
      "SELECT id FROM users WHERE upper(employee_number) = upper($1)",
      [user.employeeNumber],
    );
    const id = existing.rows[0]?.id ?? randomUUID();
    if (existing.rows[0]) {
      await client.query(
        `UPDATE users SET windows_username=$2, user_principal_name=$3, display_name=$4,
          email=$5, department=$6, job_level=$7, active=$8,
          directory_synced_at=now(), updated_at=now() WHERE id=$1`,
        [id, user.windowsUsername, user.userPrincipalName || null, user.displayName,
          user.email || null, user.department, user.jobLevel, user.active],
      );
    } else {
      await client.query(
        `INSERT INTO users
          (id, windows_username, user_principal_name, employee_number, display_name,
           email, department, job_level, active, directory_synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
        [id, user.windowsUsername, user.userPrincipalName || null, user.employeeNumber,
          user.displayName, user.email || null, user.department, user.jobLevel, user.active],
      );
    }
    await client.query("DELETE FROM user_roles WHERE user_id=$1", [id]);
    for (const role of user.roles) {
      await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1,$2)", [id, role]);
    }
  }
  if (disableMissing) {
    await client.query(
      `UPDATE users SET active=false, updated_at=now()
       WHERE NOT (upper(employee_number) = ANY($1::text[]))`,
      [users.map((user) => user.employeeNumber.toUpperCase())],
    );
  }
}

const args = process.argv.slice(2);
const csvPath = args.find((argument) => !argument.startsWith("--"));
const apply = args.includes("--apply");
const disableMissing = args.includes("--disable-missing");
if (!csvPath) {
  throw new Error("Usage: db:import-users:prod -- <employees.csv> [--apply] [--disable-missing]");
}
if (disableMissing && !apply) {
  throw new Error("--disable-missing may only be used together with --apply.");
}

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));
const suppliedPath = isAbsolute(csvPath) ? csvPath : resolve(process.cwd(), csvPath);
let csvText: string;
try {
  csvText = await readFile(suppliedPath, "utf8");
} catch (error) {
  if (isAbsolute(csvPath)) throw error;
  csvText = await readFile(resolve(projectRoot, csvPath), "utf8");
}
const users = parseUsers(csvText);
const roleCounts = users.flatMap((user) => user.roles).reduce<Record<string, number>>((counts, role) => {
  counts[role] = (counts[role] ?? 0) + 1;
  return counts;
}, {});
console.log(`Validated ${users.length} employees. Active: ${users.filter((user) => user.active).length}.`);
console.log(`Role counts: ${Object.entries(roleCounts).map(([role, count]) => `${role}=${count}`).join(", ")}.`);

if (!apply) {
  console.log("Preview only; database unchanged. Add --apply to import these employees.");
} else {
  const pool = createDatabasePool(requireDatabaseConfig());
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await applyUsers(client, users, disableMissing);
    await client.query("COMMIT");
    console.log(`Imported ${users.length} employees${disableMissing ? " and disabled missing employees" : ""}.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
