import type { TravelRequest } from "../../../shared/types/TravelRequest.js";
import type { User } from "../../../shared/types/User.js";
import { devUsers } from "../data/users.js";

// Resets whenever the backend restarts — intentional for development only.
const users: User[] = [...devUsers];
const requests: TravelRequest[] = [];

export function findUserById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function listUsers(): readonly User[] {
  return users;
}

export function findRequestById(id: string): TravelRequest | undefined {
  return requests.find((request) => request.id === id);
}

export function listRequests(): readonly TravelRequest[] {
  return requests;
}

export function createRequest(request: TravelRequest): TravelRequest {
  requests.push(request);
  return request;
}

/**
 * Replaces the stored request in place. Callers always pass the FULL updated
 * object returned by workflowService (which already carries the new audit
 * event appended) — this function never merges partial edits itself.
 */
export function updateRequest(request: TravelRequest): TravelRequest {
  const index = requests.findIndex((existing) => existing.id === request.id);
  if (index === -1) {
    throw new Error(`Cannot update request ${request.id}: it does not exist in storage.`);
  }
  requests[index] = request;
  return request;
}