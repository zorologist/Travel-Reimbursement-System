import { randomUUID } from "node:crypto";

import type {
  AuditEvent,
  SystemRole,
  TravelRequest,
  WorkflowAction,
  WorkflowStage,
} from "@travel-reimbursement/shared";


export type WorkflowErrorCode =
  | "UNAUTHORIZED_ACTION"
  | "INVALID_TRANSITION"
  | "REQUEST_ALREADY_COMPLETED"
  | "REQUEST_ALREADY_CANCELLED"
  | "EDIT_WINDOW_EXPIRED"
  | "INVALID_EDIT_FIELDS"
  | "INVALID_DATE"
  | "ALREADY_SUBMITTED";

/** Domain error intended to be mapped by a controller, not handled in this service. */
export class WorkflowServiceError extends Error {
  public readonly name = "WorkflowServiceError";

  public constructor(
    public readonly code: WorkflowErrorCode,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface WorkflowExecutionOptions {
  /** Useful for deterministic unit tests. Defaults to the current time. */
  now?: Date;
  /** Useful when event IDs are assigned by an upstream service or test. */
  auditEventId?: string;
}

type EditableField = Exclude<keyof TravelRequest, "id" | "employeeId" | "stage" | "createdAt" | "updatedAt" | "auditEvents">;
export type RequestEdits = Partial<Pick<TravelRequest, EditableField>>;
export type FieldChanges = Record<string, { before: unknown; after: unknown }>;

const NEXT_STAGE: Readonly<Partial<Record<WorkflowStage, WorkflowStage>>> = {
  "manager-review": "pr-review",
  "pr-review": "transportation-review",
  "transportation-review": "timing-review",
  "timing-review": "salary-finalization",
};

const EDITABLE_FIELDS: Readonly<Record<SystemRole, readonly EditableField[]>> = {
  employee: [
    "destinationCity",
    "departureAt",
    "returnAt",
    "accommodationType",
    "transportationMethod",
  ],
  manager: [],
  pr: ["accommodationType"],
  transportation: ["transportationMethod", "transportationCost"],
  timing: [
    "verifiedDepartureAt",
    "verifiedReturnAt",
    "verifiedSameDayHours",
    "verifiedReturnDayHours",
  ],
  salary: ["bonusAmount", "penaltyAmount", "finalSalary"],
};

function currentTime(options?: WorkflowExecutionOptions): Date {
  return options?.now ? new Date(options.now.getTime()) : new Date();
}

function optionsAt(options: WorkflowExecutionOptions | undefined, now: Date): WorkflowExecutionOptions {
  return { ...options, now };
}

function toIsoString(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new WorkflowServiceError("INVALID_DATE", "A valid date is required.");
  }
  return date.toISOString();
}

function assertNotTerminal(request: TravelRequest): void {
  if (request.stage === "completed") {
    throw new WorkflowServiceError("REQUEST_ALREADY_COMPLETED", "Completed requests cannot be changed.");
  }
  if (request.stage === "cancelled") {
    throw new WorkflowServiceError("REQUEST_ALREADY_CANCELLED", "Cancelled requests cannot be changed.");
  }
}

function assertOwner(request: TravelRequest, actorId: string): void {
  if (request.employeeId !== actorId) {
    throw new WorkflowServiceError("UNAUTHORIZED_ACTION", "An employee may act only on their own request.");
  }
}

function assertAllowed(allowed: boolean, action: WorkflowAction): void {
  if (!allowed) {
    throw new WorkflowServiceError(
      "UNAUTHORIZED_ACTION",
      `The current actor is not allowed to ${action} this request at its current stage.`,
    );
  }
}

function stageChange(from: WorkflowStage | null, to: WorkflowStage): FieldChanges {
  return { stage: { before: from, after: to } };
}

/** Creates an event without doing any persistence or transport work. */
export function createAuditEvent(
  requestId: string,
  actorId: string,
  actorRole: SystemRole,
  action: WorkflowAction,
  fromStage: WorkflowStage | null,
  toStage: WorkflowStage,
  changes: FieldChanges,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): AuditEvent {
  return {
    id: options?.auditEventId ?? randomUUID(),
    requestId,
    actorId,
    actorRole,
    action,
    fromStage,
    toStage,
    changes,
    note,
    createdAt: toIsoString(currentTime(options)),
  };
}

function withAuditEvent(
  request: TravelRequest,
  event: AuditEvent,
  updatedAt: string,
  updates: Partial<TravelRequest> = {},
): TravelRequest {
  return {
    ...request,
    ...updates,
    updatedAt,
    auditEvents: [...request.auditEvents, event],
  };
}

/** A reviewer can approve only the department stage they own. Salary approval is recorded in-place. */
export function canApprove(request: TravelRequest, role: SystemRole): boolean {
  return (
    (request.stage === "manager-review" && role === "manager") ||
    (request.stage === "pr-review" && role === "pr") ||
    (request.stage === "transportation-review" && role === "transportation") ||
    (request.stage === "timing-review" && role === "timing") ||
    (request.stage === "salary-finalization" && role === "salary")
  );
}

/** Rejection is intentionally limited to the manager-review stage. */
export function canReject(request: TravelRequest, role: SystemRole): boolean {
  return request.stage === "manager-review" && role === "manager";
}

export function canEdit(
  request: TravelRequest,
  actorId: string,
  role: SystemRole,
  options?: WorkflowExecutionOptions,
): boolean {
  if (request.stage === "completed" || request.stage === "cancelled") return false;

  if (role === "employee") {
    if (request.employeeId !== actorId || request.stage !== "manager-review") return false;
    const createdAt = new Date(request.createdAt);
    const now = currentTime(options);
    const elapsed = now.getTime() - createdAt.getTime();
    return !Number.isNaN(createdAt.getTime()) && elapsed >= 0 && elapsed <= 30 * 60 * 1000;
  }

  return (
    (role === "pr" && request.stage === "pr-review") ||
    (role === "transportation" && request.stage === "transportation-review") ||
    (role === "timing" && request.stage === "timing-review") ||
    (role === "salary" && request.stage === "salary-finalization")
  );
}

export function canFinalize(request: TravelRequest, role: SystemRole): boolean {
  return request.stage === "salary-finalization" && role === "salary";
}

/**
 * TravelRequest has no draft stage. A submitted request is therefore represented by
 * `stage: "manager-review"` plus a submit audit event, rather than by a stage transition.
 */
export function submitRequest(
  request: TravelRequest,
  actorId: string,
  actorRole: SystemRole,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): TravelRequest {
  assertNotTerminal(request);
  assertAllowed(actorRole === "employee" && request.stage === "manager-review", "submit");
  assertOwner(request, actorId);

  if (request.auditEvents.some((event) => event.action === "submit")) {
    throw new WorkflowServiceError("ALREADY_SUBMITTED", "This request has already been submitted.");
  }

  const now = currentTime(options);
  const departureAt = new Date(request.departureAt);
  if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() <= now.getTime()) {
    throw new WorkflowServiceError("INVALID_DATE", "A request must be submitted before its departure time.");
  }

  const event = createAuditEvent(
    request.id, actorId, actorRole, "submit", null, "manager-review", {}, note, optionsAt(options, now),
  );
  return withAuditEvent(request, event, toIsoString(now));
}

export function approveRequest(
  request: TravelRequest,
  actorId: string,
  actorRole: SystemRole,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): TravelRequest {
  assertNotTerminal(request);
  assertAllowed(canApprove(request, actorRole), "approve");

  const now = currentTime(options);
  // Salary has no separate post-approval stage in the model. Its approval is therefore auditable
  // but remains in salary-finalization until the explicit, irreversible finalize action.
  const toStage = NEXT_STAGE[request.stage] ?? request.stage;
  const event = createAuditEvent(
    request.id, actorId, actorRole, "approve", request.stage, toStage,
    toStage === request.stage ? {} : stageChange(request.stage, toStage), note, optionsAt(options, now),
  );
  return withAuditEvent(request, event, toIsoString(now), { stage: toStage });
}

export function rejectRequest(
  request: TravelRequest,
  actorId: string,
  actorRole: SystemRole,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): TravelRequest {
  assertNotTerminal(request);
  assertAllowed(canReject(request, actorRole), "reject");

  const now = currentTime(options);
  const event = createAuditEvent(
    request.id, actorId, actorRole, "reject", request.stage, "cancelled",
    stageChange(request.stage, "cancelled"), note, optionsAt(options, now),
  );
  return withAuditEvent(request, event, toIsoString(now), { stage: "cancelled" });
}

function changesFor(request: TravelRequest, edits: RequestEdits): FieldChanges {
  const changes: FieldChanges = {};
  for (const [field, after] of Object.entries(edits) as [EditableField, TravelRequest[EditableField]][]) {
    const before = request[field];
    if (!Object.is(before, after)) changes[field] = { before, after };
  }
  return changes;
}

function assertEditableFields(role: SystemRole, edits: RequestEdits): void {
  const permitted = EDITABLE_FIELDS[role];
  const prohibited = Object.keys(edits).filter((field) => !permitted.includes(field as EditableField));
  if (prohibited.length > 0) {
    throw new WorkflowServiceError(
      "INVALID_EDIT_FIELDS",
      `The ${role} role cannot edit: ${prohibited.join(", ")}.`,
    );
  }
}

export function editRequest(
  request: TravelRequest,
  actorId: string,
  actorRole: SystemRole,
  edits: RequestEdits,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): TravelRequest {
  assertNotTerminal(request);
  if (actorRole === "employee") assertOwner(request, actorId);
  if (actorRole === "employee" && !canEdit(request, actorId, actorRole, options)) {
    throw new WorkflowServiceError("EDIT_WINDOW_EXPIRED", "Employees may edit only during the first 30 minutes after creation.");
  }
  assertAllowed(canEdit(request, actorId, actorRole, options), "edit");
  assertEditableFields(actorRole, edits);

  const now = currentTime(options);
  const changes = changesFor(request, edits);
  const event = createAuditEvent(
    request.id, actorId, actorRole, "edit", request.stage, request.stage, changes, note, optionsAt(options, now),
  );
  return withAuditEvent(request, event, toIsoString(now), edits);
}

export function finalizeRequest(
  request: TravelRequest,
  actorId: string,
  actorRole: SystemRole,
  note: string | null = null,
  options?: WorkflowExecutionOptions,
): TravelRequest {
  assertNotTerminal(request);
  assertAllowed(canFinalize(request, actorRole), "finalize");

  const now = currentTime(options);
  const event = createAuditEvent(
    request.id, actorId, actorRole, "finalize", request.stage, "completed",
    stageChange(request.stage, "completed"), note, optionsAt(options, now),
  );
  return withAuditEvent(request, event, toIsoString(now), { stage: "completed" });
}

/** Moves only a valid approval stage forward; included for callers needing transition validation. */
export function moveToNextStage(stage: WorkflowStage): WorkflowStage {
  const next = NEXT_STAGE[stage];
  if (!next) {
    throw new WorkflowServiceError("INVALID_TRANSITION", `There is no approval transition from ${stage}.`);
  }
  return next;
}
// Sequential approval and role-permission rules will belong here so workflow steps cannot be skipped.
