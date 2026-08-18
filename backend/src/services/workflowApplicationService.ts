import { randomUUID } from "node:crypto";
import type {
  PriceRevision,
  SalaryCalculationResult,
  SystemRole,
  TravelRequest,
  User,
} from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";
import { appStore } from "../storage/appStore.js";
import { recalculateSalaryPreview } from "./salaryService.js";
import {
  approveRequest,
  editRequest,
  finalizeRequest,
  rejectRequest,
  requestMoreInfo,
  type FieldChanges,
  type RequestEdits,
} from "./workflowService.js";

export interface ApprovalInput {
  reason?: string;
  accommodationType?: TravelRequest["accommodationType"];
  destination?: string;
  method?: string;
  transportationCost?: number;
  departureAt?: string;
  returnAt?: string;
  meetsSevenHourRule?: boolean;
}

export interface SalaryReviewInput {
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  note: string;
}

export interface DepartmentReviewInput extends Omit<ApprovalInput, "reason"> {
  bonusAmount?: number;
  penaltyAmount?: number;
  timeNeedsVerification?: boolean;
  note?: string;
}

async function requestOrThrow(id: string): Promise<TravelRequest> {
  const record = await appStore.findRequestById(id);
  if (!record) throw new ApiError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
  return record;
}

async function ownerOrThrow(record: TravelRequest): Promise<User> {
  const owner = await appStore.findUserById(record.employeeId);
  if (!owner) throw new ApiError(500, "REQUEST_OWNER_NOT_FOUND", "The request owner could not be resolved.");
  return owner;
}

function departmentRole(user: User): Exclude<SystemRole, "employee"> {
  const role = user.roles.find((candidate): candidate is Exclude<SystemRole, "employee"> => candidate !== "employee");
  if (!role) throw new ApiError(403, "FORBIDDEN", "Only department reviewers can perform this action.");
  return role;
}

function assertAssignedManager(record: TravelRequest, actor: User, role: SystemRole): void {
  if (role === "manager" && record.managerId !== actor.id) {
    throw new ApiError(403, "FORBIDDEN", "Only the manager selected on this request may access or act on it.");
  }
}

function changesBetween(record: TravelRequest, edits: RequestEdits): FieldChanges {
  const changes: FieldChanges = {};
  for (const [field, after] of Object.entries(edits)) {
    const before = record[field as keyof TravelRequest];
    if (!Object.is(before, after)) changes[field] = { before, after };
  }
  return changes;
}

function revision(
  record: TravelRequest,
  actor: User,
  role: SystemRole,
  previousCalculation: SalaryCalculationResult,
  newCalculation: SalaryCalculationResult,
  changes: FieldChanges,
  note: string,
): PriceRevision {
  return {
    id: randomUUID(),
    requestId: record.id,
    stage: record.stage,
    actorId: actor.id,
    actorRole: role,
    previousCalculation,
    newCalculation,
    difference: Math.round((newCalculation.totalAmount - previousCalculation.totalAmount + Number.EPSILON) * 100) / 100,
    changes,
    note,
    createdAt: new Date().toISOString(),
  };
}

async function applyFinancialEdits(record: TravelRequest, actor: User, role: SystemRole, edits: RequestEdits, note: string): Promise<TravelRequest> {
  if (Object.keys(edits).length === 0) return record;
  const changes = changesBetween(record, edits);
  let updated = editRequest(record, actor.id, role, edits, note || null);
  const previousCalculation = record.salaryPreview;
  const nextCalculation = recalculateSalaryPreview(updated, await ownerOrThrow(updated));
  updated = { ...updated, salaryPreview: nextCalculation };
  if (nextCalculation.totalAmount !== previousCalculation.totalAmount) {
    updated.priceRevisions = [
      ...updated.priceRevisions,
      revision(updated, actor, role, previousCalculation, nextCalculation, changes, note || `${role} review adjustment.`),
    ];
  }
  return updated;
}

function approvalEdits(record: TravelRequest, role: SystemRole, input: ApprovalInput): RequestEdits {
  if (role === "manager") return {};
  if (role === "pr") {
    return input.accommodationType ? { accommodationType: input.accommodationType } : {};
  }
  if (role === "transportation") {
    return {
      ...(input.destination ? { destinationCity: input.destination } : {}),
      ...(input.method ? { transportationMethod: input.method } : {}),
    };
  }
  if (role === "timing") {
    const departureAt = input.departureAt ?? record.departureAt;
    const returnAt = record.tripType === "one-way" ? departureAt : input.returnAt ?? record.returnAt;
    if (record.tripType === "round-trip" && new Date(returnAt).getTime() <= new Date(departureAt).getTime()) {
      throw new ApiError(400, "INVALID_TRAVEL_DATES", "The verified return time must be after departure.");
    }
    const sameDay = departureAt.slice(0, 10) === returnAt.slice(0, 10);
    const qualifyingHours = record.tripType === "one-way" ? 0 : input.meetsSevenHourRule ? 7 : 0;
    return {
      verifiedDepartureAt: departureAt,
      verifiedReturnAt: returnAt,
      verifiedSameDayHours: sameDay ? qualifyingHours : 0,
      verifiedReturnDayHours: sameDay ? 0 : qualifyingHours,
    };
  }
  throw new ApiError(409, "INVALID_TRANSITION", "Salary requests must be finalized from the Salary dashboard.");
}

function assertApprovalFields(role: SystemRole, input: ApprovalInput): void {
  const provided = Object.entries(input).filter(([, value]) => value !== undefined).map(([field]) => field);
  const allowed: Partial<Record<SystemRole, readonly string[]>> = {
    manager: ["reason"],
    pr: ["reason", "accommodationType"],
    transportation: ["reason", "destination", "method"],
    timing: ["reason", "departureAt", "returnAt", "meetsSevenHourRule"],
  };
  const prohibited = provided.filter((field) => !(allowed[role] ?? []).includes(field));
  if (prohibited.length > 0) {
    throw new ApiError(400, "INVALID_EDIT_FIELDS", `The ${role} role cannot submit: ${prohibited.join(", ")}.`);
  }
}

export async function approveWorkflowRequest(id: string, actor: User, input: ApprovalInput): Promise<TravelRequest> {
  const record = await requestOrThrow(id);
  const role = departmentRole(actor);
  assertAssignedManager(record, actor, role);
  assertApprovalFields(role, input);
  const edits = approvalEdits(record, role, input);
  const note = input.reason?.trim() ?? "";
  const reviewed = await applyFinancialEdits(record, actor, role, edits, note);
  const approved = approveRequest(reviewed, actor.id, role, note || null);
  return await appStore.replaceRequest(id, approved) ?? await requestOrThrow(id);
}

export async function rejectWorkflowRequest(id: string, actor: User, reason: string): Promise<TravelRequest> {
  const record = await requestOrThrow(id);
  const role = departmentRole(actor);
  assertAssignedManager(record, actor, role);
  const rejected = rejectRequest(record, actor.id, role, reason);
  return await appStore.replaceRequest(id, rejected) ?? await requestOrThrow(id);
}

/**
 * Manager-only: ask the employee for more information. Flags the request with
 * `pendingEmployeeResponse: true` so the employee sees a banner next time they
 * open the app. (No email/SMS notification — see assumption #4 in the spec.)
 */
export async function requestInfoFromEmployee(id: string, actor: User, note: string): Promise<TravelRequest> {
  const record = await requestOrThrow(id);
  const role = departmentRole(actor);
  assertAssignedManager(record, actor, role);
  if (role !== "manager") {
    throw new ApiError(403, "FORBIDDEN", "Only a manager can request more information from the employee.");
  }
  const updated = requestMoreInfo(record, actor.id, role, note);
  return await appStore.replaceRequest(id, updated) ?? await requestOrThrow(id);
}

export async function reviewWorkflowRequest(id: string, actor: User, input: DepartmentReviewInput): Promise<TravelRequest> {
  const record = await requestOrThrow(id);
  const role = departmentRole(actor);
  assertAssignedManager(record, actor, role);
  const note = input.note?.trim() ?? "";
  let edits: RequestEdits;
  if (role === "manager") {
    // Manager can only clear the timeNeedsVerification flag (set true by timing-review).
    const provided = Object.keys(input).filter((field) => field !== "note" && input[field as keyof DepartmentReviewInput] !== undefined);
    const prohibited = provided.filter((field) => field !== "timeNeedsVerification");
    if (prohibited.length > 0) throw new ApiError(400, "INVALID_EDIT_FIELDS", `The manager role cannot submit: ${prohibited.join(", ")}.`);
    if (!record.timeNeedsVerification || input.timeNeedsVerification !== false) {
      throw new ApiError(409, "TIME_CONFIRMATION_NOT_REQUIRED", "This request is not awaiting manager time confirmation.");
    }
    edits = { timeNeedsVerification: false };
  } else if (role === "salary") {
    if (record.stage === "completed") {
      throw new ApiError(409, "REQUEST_ALREADY_COMPLETED", "Completed requests cannot be changed.");
    }
    if (record.stage === "cancelled") {
      throw new ApiError(409, "REQUEST_ALREADY_CANCELLED", "Cancelled requests cannot be changed.");
    }
    if (record.stage !== "salary-finalization") {
      throw new ApiError(409, "INVALID_TRANSITION", "Payroll adjustments are allowed only during salary finalization.");
    }
    const provided = Object.keys(input).filter((field) => field !== "note" && input[field as keyof DepartmentReviewInput] !== undefined);
    const prohibited = provided.filter((field) => field !== "bonusAmount" && field !== "penaltyAmount" && field !== "transportationCost");
    if (prohibited.length > 0) throw new ApiError(400, "INVALID_EDIT_FIELDS", `The salary role cannot submit: ${prohibited.join(", ")}.`);
    edits = {
      bonusAmount: input.bonusAmount ?? record.bonusAmount,
      penaltyAmount: input.penaltyAmount ?? record.penaltyAmount,
      ...(input.transportationCost !== undefined ? {
        transportationCost: input.transportationCost,
        transportationCostVerified: true,
      } : {}),
    };
  } else {
    const approvalInput: ApprovalInput = { ...input, reason: note };
    assertApprovalFields(role, approvalInput);
    edits = approvalEdits(record, role, approvalInput);
  }
  const updated = await applyFinancialEdits(record, actor, role, edits, note);
  return await appStore.replaceRequest(id, updated) ?? await requestOrThrow(id);
}

export async function reviewSalaryRequest(id: string, actor: User, input: SalaryReviewInput): Promise<TravelRequest> {
  return reviewWorkflowRequest(id, actor, input);
}

export async function finalizeSalaryRequest(id: string, actor: User, note: string): Promise<TravelRequest> {
  const record = await requestOrThrow(id);
  const role = departmentRole(actor);
  if (role !== "salary") throw new ApiError(403, "FORBIDDEN", "Only Salary may finalize a request.");
  if (!record.transportationCostVerified) {
    throw new ApiError(409, "TICKET_PRICE_REQUIRED", "Payroll must enter and save the verified ticket price before finalization.");
  }
  const recalculated = { ...record, salaryPreview: recalculateSalaryPreview(record, await ownerOrThrow(record)) };
  const finalized = finalizeRequest(recalculated, actor.id, role, note.trim());
  finalized.priceRevisions = [
    ...finalized.priceRevisions,
    revision(finalized, actor, role, recalculated.salaryPreview, finalized.finalSalary!, { finalSalary: { before: null, after: finalized.finalSalary } }, note.trim()),
  ];
  return await appStore.replaceRequest(id, finalized) ?? await requestOrThrow(id);
}
