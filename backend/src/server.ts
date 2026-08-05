// This process entry point starts the configured Express application on the selected port.
import { app } from "./app.js";
import { validateRuntime } from "./config/runtimeValidation.js";
import { databasePool } from "./database/databasePool.js";
import { log } from "./observability/logger.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST?.trim() || "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

validateRuntime();
let schemaVersion: string | null = null;
if (databasePool) {
  const schema = await databasePool.query(
    "SELECT filename AS version FROM schema_migrations ORDER BY filename DESC LIMIT 1",
  );
  schemaVersion = schema.rows[0]?.version ?? null;
  if (!schemaVersion) throw new Error("Database migrations have not been applied.");
}

const server = app.listen(port, host, () => {
  log("info", "application_started", {
    host,
    port,
    storage: databasePool ? "postgres" : "memory",
    schemaVersion,
  });
});

let shuttingDown = false;
async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log("info", "application_stopping", { signal });
  const forceTimer = setTimeout(() => {
    log("error", "forced_shutdown", { signal });
    process.exit(1);
  }, 10_000);
  forceTimer.unref();
  server.close(async () => {
    try {
      await databasePool?.end();
      log("info", "application_stopped", { signal });
      process.exit(exitCode);
    } catch (error) {
      log("error", "shutdown_failed", { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  log("error", "uncaught_exception", { error: error.message, stack: error.stack });
  void shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  log("error", "unhandled_rejection", { error: reason instanceof Error ? reason.message : String(reason) });
  void shutdown("unhandledRejection", 1);
});
