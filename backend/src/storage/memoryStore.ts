import type { AuditEvent, TravelRequest, User } from "@travel-reimbursement/shared";
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

export function findRequestById(id: string): TravelRequest | undefined {
  const request = requests.find((candidate) => candidate.id === id);
  return request ? clone(request) : undefined;
}

export function createRequest(newRequest: TravelRequest): TravelRequest {
  if (requests.some((request) => request.id === newRequest.id)) {
    throw new Error(`A request with ID ${newRequest.id} already exists.`);
  }

  const stored = clone(newRequest);
  requests.push(stored);
  return clone(stored);
}

export function updateRequest(
  id: string,
  updates: Partial<TravelRequest>,
): TravelRequest | null {
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) return null;

  const current = requests[index];
  const nextAuditEvents = updates.auditEvents ?? current.auditEvents;
  if (!auditHistoryIsAppendOnly(current.auditEvents, nextAuditEvents)) {
    throw new Error("Audit history is append-only and cannot be changed or removed.");
  }

  const updated: TravelRequest = {
    ...current,
    ...clone(updates),
    id: current.id,
    employeeId: current.employeeId,
    createdAt: current.createdAt,
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
    auditEvents: clone(nextAuditEvents),
  };

  requests[index] = updated;
  return clone(updated);
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
