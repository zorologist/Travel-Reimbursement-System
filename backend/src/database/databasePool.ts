import { databaseConfig } from "./config.js";
import { createDatabasePool } from "./pool.js";

const config = databaseConfig();

/** Shared application pool. It is absent when tests intentionally use memory storage. */
export const databasePool = config ? createDatabasePool(config) : null;
