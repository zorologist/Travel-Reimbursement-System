import { developmentUsers } from "../data/users.js";
import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Development users must never be seeded in production.");
}

const pool = createDatabasePool(requireDatabaseConfig());
const client = await pool.connect();

try {
  await client.query("BEGIN");
  for (const user of developmentUsers) {
    const windowsUsername = `EGAS\\${user.employeeNumber}`;
    const userPrincipalName = `${user.employeeNumber.toLowerCase()}@egas.local`;
    await client.query(
      `INSERT INTO users
        (id, windows_username, user_principal_name, employee_number, display_name, department, job_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         windows_username = EXCLUDED.windows_username,
         user_principal_name = EXCLUDED.user_principal_name,
         employee_number = EXCLUDED.employee_number,
         display_name = EXCLUDED.display_name,
         department = EXCLUDED.department,
         job_level = EXCLUDED.job_level,
         active = true,
         updated_at = now()`,
      [user.id, windowsUsername, userPrincipalName, user.employeeNumber,
        user.displayName, user.department, user.jobLevel],
    );
    for (const role of user.roles) {
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
         ON CONFLICT (user_id, role) DO NOTHING`,
        [user.id, role],
      );
    }
  }
  await client.query("COMMIT");
  console.log(`Seeded ${developmentUsers.length} development users.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
