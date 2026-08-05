import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

const migrationsDirectory = fileURLToPath(new URL("../../migrations/", import.meta.url));
const migrationLockId = 2_047_315_981;

export async function migrate(): Promise<void> {
  const pool = createDatabasePool(requireDatabaseConfig());
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [migrationLockId]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const filenames = (await readdir(migrationsDirectory))
      .filter((filename) => /^\d+.*\.sql$/i.test(filename))
      .sort();

    for (const filename of filenames) {
      const applied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename=$1",
        [filename],
      );
      if (applied.rowCount) continue;

      const sql = await readFile(new URL(`../../migrations/${filename}`, import.meta.url), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );
        await client.query("COMMIT");
        console.log(`Applied migration ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [migrationLockId]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, "/")}`).href) {
  migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
