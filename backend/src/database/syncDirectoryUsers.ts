import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { Client } from "ldapts";
import type { PoolClient } from "pg";

import { directoryConfig } from "../auth/directoryConfig.js";
import { ARABIC_TITLE_TO_JOB_LEVEL, type JobLevel } from "../data/jobLevels.js";
import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

// Pulls every real account from Active Directory, defaults everyone to the
// "employee" role, applies a small manual override file for anyone with
// additional roles (manager/pr/transportation/timing/salary), and maps AD's
// Arabic `title` attribute to this app's job_level categories. Accounts
// whose title doesn't match a known category are reported but skipped, so a
// bad/missing AD title never silently imports wrong data.
//
// Usage: db:sync-directory-users:prod -- <bind-username> <bind-password> [--roles overrides.json] [--apply]

const ROLES = new Set(["employee", "manager", "pr", "transportation", "timing", "salary"]);
const UAC_ACCOUNTDISABLE = 0x2;

interface DirectoryUser {
  windowsUsername: string;
  userPrincipalName: string;
  employeeNumber: string;
  displayName: string;
  email: string;
  department: string;
  jobLevel: JobLevel | null;
  rawTitle: string;
  active: boolean;
  extraRoles: string[];
}

async function loadRoleOverrides(path: string | undefined): Promise<Map<string, string[]>> {
  const overrides = new Map<string, string[]>();
  if (!path) return overrides;
  const suppliedPath = isAbsolute(path) ? path : resolve(process.cwd(), path);
  const text = await readFile(suppliedPath, "utf8");
  const parsed = JSON.parse(text) as Record<string, string[]>;
  for (const [username, roles] of Object.entries(parsed)) {
    const invalid = roles.filter((role) => !ROLES.has(role));
    if (invalid.length > 0) {
      throw new Error(`Role override for '${username}' has invalid roles: ${invalid.join(", ")}.`);
    }
    overrides.set(username.trim().toLowerCase(), roles);
  }
  return overrides;
}

async function searchDirectory(bindUsername: string, bindPassword: string): Promise<Record<string, unknown>[]> {
  const { url, domain } = directoryConfig();
  const bindDn = bindUsername.includes("@") ? bindUsername : `${bindUsername}@${domain}`;
  const base = domain.split(".").map((part) => `dc=${part}`).join(",");
  const client = new Client({ url, connectTimeout: 5_000, timeout: 30_000 });
  try {
    await client.bind(bindDn, bindPassword);
    const { searchEntries } = await client.search(base, {
      scope: "sub",
      filter: "(&(objectCategory=person)(objectClass=user))",
      attributes: [
        "sAMAccountName", "userPrincipalName", "displayName", "mail",
        "department", "title", "employeeNumber", "userAccountControl",
      ],
      paged: { pageSize: 500 },
    });
    return searchEntries as unknown as Record<string, unknown>[];
  } finally {
    await client.unbind().catch(() => {});
  }
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return asText(value[0]);
  if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
  return String(value ?? "").trim();
}

function toDirectoryUser(entry: Record<string, unknown>, overrides: Map<string, string[]>): DirectoryUser | null {
  const sam = asText(entry.sAMAccountName);
  if (!sam) return null;
  const rawTitle = asText(entry.title);
  const uac = Number(asText(entry.userAccountControl)) || 0;
  return {
    windowsUsername: `EGAS\\${sam}`,
    userPrincipalName: asText(entry.userPrincipalName),
    employeeNumber: asText(entry.employeeNumber) || sam.toUpperCase(),
    displayName: asText(entry.displayName) || sam,
    email: asText(entry.mail),
    department: asText(entry.department),
    jobLevel: ARABIC_TITLE_TO_JOB_LEVEL[rawTitle] ?? null,
    rawTitle,
    active: (uac & UAC_ACCOUNTDISABLE) === 0,
    extraRoles: overrides.get(sam.toLowerCase()) ?? [],
  };
}

const FALLBACK_JOB_LEVEL: JobLevel = "Level 1";
const FALLBACK_DEPARTMENT = "Unassigned";

interface ApplyFailure {
  windowsUsername: string;
  reason: string;
}

/**
 * Each account is applied inside its own SAVEPOINT so one bad AD record
 * (missing required fields, a duplicate employee number, etc.) can never
 * roll back everyone else - it's reported and skipped instead.
 */
async function applyUsers(client: PoolClient, users: DirectoryUser[]): Promise<ApplyFailure[]> {
  const failures: ApplyFailure[] = [];
  for (const user of users) {
    const jobLevel = user.jobLevel ?? FALLBACK_JOB_LEVEL;
    const department = user.department || FALLBACK_DEPARTMENT;
    const roles = [...new Set(["employee", ...user.extraRoles])];
    await client.query("SAVEPOINT sync_user");
    try {
      const existing = await client.query(
        "SELECT id FROM users WHERE upper(employee_number) = upper($1) OR upper(windows_username) = upper($2)",
        [user.employeeNumber, user.windowsUsername],
      );
      const id = existing.rows[0]?.id ?? randomUUID();
      if (existing.rows[0]) {
        await client.query(
          `UPDATE users SET windows_username=$2, user_principal_name=$3, display_name=$4,
            email=$5, department=$6, job_level=$7, active=$8,
            directory_synced_at=now(), updated_at=now() WHERE id=$1`,
          [id, user.windowsUsername, user.userPrincipalName || null, user.displayName,
            user.email || null, department, jobLevel, user.active],
        );
      } else {
        await client.query(
          `INSERT INTO users
            (id, windows_username, user_principal_name, employee_number, display_name,
             email, department, job_level, active, directory_synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
          [id, user.windowsUsername, user.userPrincipalName || null, user.employeeNumber,
            user.displayName, user.email || null, department, jobLevel, user.active],
        );
      }
      await client.query("DELETE FROM user_roles WHERE user_id=$1", [id]);
      for (const role of roles) {
        await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1,$2)", [id, role]);
      }
      await client.query("RELEASE SAVEPOINT sync_user");
    } catch (error) {
      await client.query("ROLLBACK TO SAVEPOINT sync_user");
      failures.push({ windowsUsername: user.windowsUsername, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return failures;
}

const args = process.argv.slice(2);
const positional = args.filter((argument) => !argument.startsWith("--"));
const [bindUsername, bindPassword] = positional;
const apply = args.includes("--apply");
const rolesFlagIndex = args.indexOf("--roles");
const rolesPath = rolesFlagIndex >= 0 ? args[rolesFlagIndex + 1] : undefined;

if (!bindUsername || !bindPassword) {
  throw new Error("Usage: db:sync-directory-users:prod -- <bind-username> <bind-password> [--roles overrides.json] [--apply]");
}

const overrides = await loadRoleOverrides(rolesPath);
const entries = await searchDirectory(bindUsername, bindPassword);
const users = entries
  .map((entry) => toDirectoryUser(entry, overrides))
  .filter((user): user is DirectoryUser => user !== null);

const mapped = users.filter((user) => user.jobLevel !== null);
const unmapped = users.filter((user) => user.jobLevel === null);

console.log(`Found ${users.length} AD accounts. ${mapped.length} have a recognized job title, ${unmapped.length} do not.`);
if (unmapped.length > 0) {
  console.log(`\nUnrecognized titles (imported anyway with a placeholder job_level of "${FALLBACK_JOB_LEVEL}" - fix these later):`);
  const counts = new Map<string, number>();
  for (const user of unmapped) {
    const key = user.rawTitle || "(blank title)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [title, count] of counts) {
    console.log(`  "${title}" - ${count} account(s)`);
  }
}

if (!apply) {
  console.log("\nPreview only; database unchanged. Add --apply to import everyone.");
} else {
  const pool = createDatabasePool(requireDatabaseConfig());
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const failures = await applyUsers(client, users);
    await client.query("COMMIT");
    const succeeded = users.length - failures.length;
    console.log(`\nImported ${succeeded} employees (${mapped.length} with a real job level, ${unmapped.length} with the "${FALLBACK_JOB_LEVEL}" placeholder).`);
    if (failures.length > 0) {
      console.log(`\n${failures.length} account(s) FAILED and were skipped (everyone else still imported fine):`);
      for (const failure of failures) {
        console.log(`  ${failure.windowsUsername}: ${failure.reason}`);
      }
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
