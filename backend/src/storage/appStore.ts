import { databasePool } from "../database/databasePool.js";
import * as memory from "./memoryStore.js";
import { PostgresStore } from "./postgresStore.js";
import type { StorageInterface } from "./storageTypes.js";

const memoryAdapter: StorageInterface = {
  listUsers: async () => memory.listUsers(),
  findUserById: async (id) => memory.findUserById(id),
  findUserByEmployeeNumber: async (employeeNumber) => memory.findUserByEmployeeNumber(employeeNumber),
  findUserByDirectoryIdentity: async (identity) => {
    const accountName = identity.trim().split("\\").at(-1)?.split("@")[0] ?? "";
    return memory.findUserByEmployeeNumber(accountName);
  },
  listRequests: async () => memory.listRequests(),
  listRequestsByOwner: async (employeeId) => memory.listRequestsByOwner(employeeId),
  listRequestsByStage: async (stage) => memory.listRequestsByStage(stage),
  listRequestsForRole: async (role, userId) => memory.listRequestsForRole(role, userId),
  findRequestById: async (id) => memory.findRequestById(id),
  nextRequestId: async (now) => memory.nextRequestId(now),
  createRequest: async (request) => memory.createRequest(request),
  updateRequest: async (id, updates) => memory.updateRequest(id, updates),
  replaceRequest: async (id, request) => memory.replaceRequest(id, request),
  addAuditEvent: async (requestId, event) => memory.addAuditEvent(requestId, event),
};

const configuredMode = process.env.STORAGE_MODE?.trim().toLowerCase();
if (configuredMode && !["memory", "postgres"].includes(configuredMode)) {
  throw new Error("STORAGE_MODE must be either memory or postgres.");
}
if (configuredMode === "postgres" && !databasePool) {
  throw new Error("STORAGE_MODE=postgres requires database connection settings.");
}

/** Tests default to deterministic fixtures; configured application runs default to PostgreSQL. */
export const appStore: StorageInterface = configuredMode === "memory"
  || (!configuredMode && process.env.NODE_ENV === "test")
  || (!configuredMode && !databasePool)
  ? memoryAdapter
  : new PostgresStore(databasePool!);
