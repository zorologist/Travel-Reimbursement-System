import type {
  AuditEvent,
  SystemRole,
  TravelRequest,
  User,
  WorkflowStage,
} from "@travel-reimbursement/shared";
import { createDevelopmentRequests } from "../data/requests.js";
import { developmentUsers } from "../data/users.js";

let users: User[] = [...clone(developmentUsers)];
let requests: TravelRequest[] = createDevelopmentRequests();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function auditHistoryIsAppendOnly(
  currentEvents: readonly AuditEvent[],
  nextEvents: readonly AuditEvent[],
): boolean {
  if (nextEvents.length < currentEvents.length) return false;
  return currentEvents.every(
    (event, index) => JSON.stringify(event) === JSON.stringify(nextEvents[index]),
  );
}

function priceHistoryIsAppendOnly(
  current: readonly TravelRequest["priceRevisions"][number][],
  next: readonly TravelRequest["priceRevisions"][number][],
): boolean {
  if (next.length < current.length) return false;
  return current.every((revision, index) => JSON.stringify(revision) === JSON.stringify(next[index]));
}

export function listUsers(): User[] {
  return clone(users);
}

export function findUserById(id: string): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  return user ? clone(user) : undefined;
}

export function findUserByEmployeeNumber(employeeNumber: string): User | undefined {
  const normalized = employeeNumber.trim().toUpperCase();
  const user = users.find(
    (candidate) => candidate.employeeNumber.toUpperCase() === normalized,
  );
  return user ? clone(user) : undefined;
}

export function listRequests(): TravelRequest[] {
  return clone(requests);
}

export function listRequestsByOwner(employeeId: string): TravelRequest[] {
  return clone(requests.filter((request) => request.employeeId === employeeId));
}

export function listRequestsByStage(stage: WorkflowStage): TravelRequest[] {
  return clone(requests.filter((request) => request.stage === stage));
}

const ROLE_STAGE: Readonly<Partial<Record<SystemRole, WorkflowStage>>> = {
  manager: "manager-review",
  pr: "pr-review",
  transportation: "transportation-review",
  timing: "timing-review",
  salary: "salary-finalization",
};

export function listRequestsForRole(role: SystemRole): TravelRequest[] {
  if (role === "employee") return [];
  const stage = ROLE_STAGE[role];
  return stage ? listRequestsByStage(stage) : [];
}

export function findRequestById(id: string): TravelRequest | undefined {
  const request = requests.find((candidate) => candidate.id === id);
  return request ? clone(request) : undefined;
}

export function createRequest(newRequest: TravelRequest): TravelRequest {
  if (requests.some((request) => request.id === newRequest.id)) {
    throw new Error(`A request with ID ${newRequest.id} already exists.`);
  }

  const stored = clone(newRequest);
  requests.unshift(stored);
  return clone(stored);
}

export function updateRequest(
  id: string,
  updates: Partial<TravelRequest>,
): TravelRequest | null {
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) return null;

  const current = requests[index];
  if (current.stage === "completed" || current.stage === "cancelled") {
    throw new Error("Completed and cancelled requests are locked.");
  }
  const nextAuditEvents = updates.auditEvents ?? current.auditEvents;
  if (!auditHistoryIsAppendOnly(current.auditEvents, nextAuditEvents)) {
    throw new Error("Audit history is append-only and cannot be changed or removed.");
  }
  const nextPriceRevisions = updates.priceRevisions ?? current.priceRevisions;
  if (!priceHistoryIsAppendOnly(current.priceRevisions, nextPriceRevisions)) {
    throw new Error("Price revision history is append-only and cannot be changed or removed.");
  }

  const updated: TravelRequest = {
    ...current,
    ...clone(updates),
    id: current.id,
    employeeId: current.employeeId,
    createdAt: current.createdAt,
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
    auditEvents: clone(nextAuditEvents),
    priceRevisions: clone(nextPriceRevisions),
  };

  requests[index] = updated;
  return clone(updated);
}

export function replaceRequest(
  id: string,
  replacement: TravelRequest,
): TravelRequest | null {
  if (replacement.id !== id) {
    throw new Error("Replacement request ID must match the stored request ID.");
  }
  return updateRequest(id, replacement);
}

export function addAuditEvent(
  requestId: string,
  event: AuditEvent,
): TravelRequest | null {
  if (event.requestId !== requestId) {
    throw new Error("Audit event requestId must match the stored request ID.");
  }

  const request = requests.find((candidate) => candidate.id === requestId);
  if (!request) return null;

  return updateRequest(requestId, {
    auditEvents: [...request.auditEvents, clone(event)],
    updatedAt: event.createdAt,
  });
}

/** Restores fresh deterministic fixtures. Intended for automated tests and demos. */
export function resetStoreForTests(): void {
  users = [...clone(developmentUsers)];
  requests = createDevelopmentRequests();
}

/** Short alias for development tools that are not tied to a test framework. */
export const resetStore = resetStoreForTests;
