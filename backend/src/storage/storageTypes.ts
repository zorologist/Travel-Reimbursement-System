import type {
  AuditEvent,
  SystemRole,
  TravelRequest,
  User,
  WorkflowStage,
} from "@travel-reimbursement/shared";

/** Canonical storage boundary. Implementations must use the shared domain contracts. */
export interface StorageInterface {
  listUsers(): Promise<User[]>;
  findUserById(id: string): Promise<User | undefined>;
  findUserByEmployeeNumber(employeeNumber: string): Promise<User | undefined>;
  findUserByDirectoryIdentity(identity: string): Promise<User | undefined>;
  listRequests(): Promise<TravelRequest[]>;
  listRequestsByOwner(employeeId: string): Promise<TravelRequest[]>;
  listRequestsByStage(stage: WorkflowStage): Promise<TravelRequest[]>;
  listRequestsForRole(role: SystemRole, userId?: string): Promise<TravelRequest[]>;
  findRequestById(id: string): Promise<TravelRequest | undefined>;
  nextRequestId(now?: Date): Promise<string>;
  createRequest(request: TravelRequest): Promise<TravelRequest>;
  updateRequest(id: string, updates: Partial<TravelRequest>): Promise<TravelRequest | null>;
  replaceRequest(id: string, request: TravelRequest): Promise<TravelRequest | null>;
  addAuditEvent(requestId: string, event: AuditEvent): Promise<TravelRequest | null>;
}

export type StoredUser = User;
export type StoredRequest = TravelRequest;
export type StoredAuditEvent = AuditEvent;
