import type { Pool, PoolClient } from "pg";

import { createDevelopmentRequests } from "../data/requests.js";
import { PostgresStore } from "../storage/postgresStore.js";
import { requireDatabaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

const pool = createDatabasePool(requireDatabaseConfig());
const client = await pool.connect();

try {
  await client.query("BEGIN");
  const transactionClient = {
    query: client.query.bind(client),
    release() {},
  } as unknown as PoolClient;
  const transactionPool = {
    query: client.query.bind(client),
    async connect() {
      return transactionClient;
    },
  } as unknown as Pool;

  // The adapter normally owns its transaction. Here BEGIN/COMMIT/ROLLBACK are
  // ignored so an outer rollback can prove writes without leaving test data.
  const originalQuery = transactionClient.query.bind(transactionClient);
  transactionClient.query = ((text: unknown, values?: unknown[]) => {
    if (typeof text === "string" && ["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    return originalQuery(text as never, values as never);
  }) as PoolClient["query"];

  const template = structuredClone(createDevelopmentRequests()[0]);
  const unique = `storage-check-${Date.now()}`;
  const request = {
    ...template,
    id: unique,
    auditEvents: template.auditEvents.map((event) => ({
      ...event,
      id: `${event.id}-${unique}`,
      requestId: unique,
    })),
    priceRevisions: template.priceRevisions.map((revision) => ({
      ...revision,
      id: `${revision.id}-${unique}`,
      requestId: unique,
    })),
  };

  const store = new PostgresStore(transactionPool);
  await store.createRequest(request);
  const stored = await store.findRequestById(unique);
  if (!stored || stored.id !== unique || stored.auditEvents.length !== request.auditEvents.length) {
    throw new Error("PostgreSQL request write/read verification failed.");
  }
  console.log("PostgreSQL request write/read verification passed; test transaction rolled back.");
} finally {
  await client.query("ROLLBACK");
  client.release();
  await pool.end();
}
