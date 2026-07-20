import type {
  AuditEvent,
  SystemRole,
  TravelRequest,
  User,
  WorkflowStage,
} from "@travel-reimbursement/shared";

/** Canonical storage boundary. Implementations must use the shared domain contracts. */
export interface StorageInterface {
  listUsers(): User[];
  findUserById(id: string): User | undefined;
  findUserByEmployeeNumber(employeeNumber: string): User | undefined;
  listRequests(): TravelRequest[];
  listRequestsByOwner(employeeId: string): TravelRequest[];
  listRequestsByStage(stage: WorkflowStage): TravelRequest[];
  listRequestsForRole(role: SystemRole): TravelRequest[];
  findRequestById(id: string): TravelRequest | undefined;
  createRequest(request: TravelRequest): TravelRequest;
  updateRequest(id: string, updates: Partial<TravelRequest>): TravelRequest | null;
  replaceRequest(id: string, request: TravelRequest): TravelRequest | null;
  addAuditEvent(requestId: string, event: AuditEvent): TravelRequest | null;
  reset(): void;
}

export type StoredUser = User;
export type StoredRequest = TravelRequest;
export type StoredAuditEvent = AuditEvent;
