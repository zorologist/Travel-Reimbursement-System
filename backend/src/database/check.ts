import { PostgresStore } from "../storage/postgresStore.js";
import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

const pool = createDatabasePool(requireDatabaseConfig());

try {
  const store = new PostgresStore(pool);
  const users = await store.listUsers();
  const requests = await store.listRequests();
  const developmentEmployee = await store.findUserByEmployeeNumber("DEV001");
  if (!developmentEmployee) throw new Error("DEV001 was not found after development seeding.");
  console.log(`Database connection OK: ${users.length} active users, ${requests.length} travel requests.`);
} finally {
  await pool.end();
}
