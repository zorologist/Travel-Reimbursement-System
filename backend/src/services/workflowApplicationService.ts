import { randomUUID } from "node:crypto";
import type {
  PriceRevision,
  SalaryCalculationResult,
  SystemRole,
  TravelRequest,
  User,
} from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";
import { findRequestById, findUserById, replaceRequest } from "../storage/memoryStore.js";
import { recalculateSalaryPreview } from "./salaryService.js";
import {
  approveRequest,
  editRequest,
  finalizeRequest,
  rejectRequest,
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
  bonusAmount: number;
  penaltyAmount: number;
  note: string;
}

export interface DepartmentReviewInput extends Omit<ApprovalInput, "reason"> {
  bonusAmount?: number;
  penaltyAmount?: number;
  note?: string;
}

function requestOrThrow(id: string): TravelRequest {
  const record = findRequestById(id);
  if (!record) throw new ApiError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
  return record;
}

function ownerOrThrow(record: TravelRequest): User {
  const owner = findUserById(record.employeeId);
  if (!owner) throw new ApiError(500, "REQUEST_OWNER_NOT_FOUND", "The request owner could not be resolved.");
  return owner;
}

function departmentRole(user: User): Exclude<SystemRole, "employee"> {
  const role = user.roles.find((candidate): candidate is Exclude<SystemRole, "employee"> => candidate !== "employee");
  if (!role) throw new ApiError(403, "FORBIDDEN", "Only department reviewers can perform this action.");
  return role;
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

function applyFinancialEdits(record: TravelRequest, actor: User, role: SystemRole, edits: RequestEdits, note: string): TravelRequest {
  if (Object.keys(edits).length === 0) return record;
  const changes = changesBetween(record, edits);
  let updated = editRequest(record, actor.id, role, edits, note || null);
  const previousCalculation = record.salaryPreview;
  const nextCalculation = recalculateSalaryPreview(updated, ownerOrThrow(updated));
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
      ...(input.transportationCost !== undefined ? { transportationCost: input.transportationCost } : {}),
    };
  }
  if (role === "timing") {
    const departureAt = input.departureAt ?? record.departureAt;
    const returnAt = input.returnAt ?? record.returnAt;
    if (new Date(returnAt).getTime() <= new Date(departureAt).getTime()) {
      throw new ApiError(400, "INVALID_TRAVEL_DATES", "The verified return time must be after departure.");
    }
    const sameDay = departureAt.slice(0, 10) === returnAt.slice(0, 10);
    const qualifyingHours = input.meetsSevenHourRule ? 7 : 0;
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
    transportation: ["reason", "destination", "method", "transportationCost"],
    timing: ["reason", "departureAt", "returnAt", "meetsSevenHourRule"],
  };
  const prohibited = provided.filter((field) => !(allowed[role] ?? []).includes(field));
  if (prohibited.length > 0) {
    throw new ApiError(400, "INVALID_EDIT_FIELDS", `The ${role} role cannot submit: ${prohibited.join(", ")}.`);
  }
}

export function approveWorkflowRequest(id: string, actor: User, input: ApprovalInput): TravelRequest {
  const record = requestOrThrow(id);
  const role = departmentRole(actor);
  assertApprovalFields(role, input);
  const edits = approvalEdits(record, role, input);
  const note = input.reason?.trim() ?? "";
  const reviewed = applyFinancialEdits(record, actor, role, edits, note);
  const approved = approveRequest(reviewed, actor.id, role, note || null);
  return replaceRequest(id, approved) ?? requestOrThrow(id);
}

export function rejectWorkflowRequest(id: string, actor: User, reason: string): TravelRequest {
  const record = requestOrThrow(id);
  const rejected = rejectRequest(record, actor.id, departmentRole(actor), reason);
  return replaceRequest(id, rejected) ?? requestOrThrow(id);
}

export function reviewWorkflowRequest(id: string, actor: User, input: DepartmentReviewInput): TravelRequest {
  const record = requestOrThrow(id);
  const role = departmentRole(actor);
  const note = input.note?.trim() ?? "";
  let edits: RequestEdits;
  if (role === "salary") {
    const provided = Object.keys(input).filter((field) => field !== "note" && input[field as keyof DepartmentReviewInput] !== undefined);
    const prohibited = provided.filter((field) => field !== "bonusAmount" && field !== "penaltyAmount");
    if (prohibited.length > 0) throw new ApiError(400, "INVALID_EDIT_FIELDS", `The salary role cannot submit: ${prohibited.join(", ")}.`);
    edits = {
      bonusAmount: input.bonusAmount ?? record.bonusAmount,
      penaltyAmount: input.penaltyAmount ?? record.penaltyAmount,
    };
    if (((input.bonusAmount ?? 0) > 0 || (input.penaltyAmount ?? 0) > 0) && !note) {
      throw new ApiError(400, "ADJUSTMENT_NOTE_REQUIRED", "A note is required for a non-zero salary adjustment.");
    }
  } else {
    const approvalInput: ApprovalInput = { ...input, reason: note };
    assertApprovalFields(role, approvalInput);
    edits = approvalEdits(record, role, approvalInput);
  }
  const updated = applyFinancialEdits(record, actor, role, edits, note);
  return replaceRequest(id, updated) ?? requestOrThrow(id);
}

export function reviewSalaryRequest(id: string, actor: User, input: SalaryReviewInput): TravelRequest {
  return reviewWorkflowRequest(id, actor, input);
}

export function finalizeSalaryRequest(id: string, actor: User, note: string): TravelRequest {
  const record = requestOrThrow(id);
  const role = departmentRole(actor);
  if (role !== "salary") throw new ApiError(403, "FORBIDDEN", "Only Salary may finalize a request.");
  const recalculated = { ...record, salaryPreview: recalculateSalaryPreview(record, ownerOrThrow(record)) };
  const finalized = finalizeRequest(recalculated, actor.id, role, note.trim());
  finalized.priceRevisions = [
    ...finalized.priceRevisions,
    revision(finalized, actor, role, recalculated.salaryPreview, finalized.finalSalary!, { finalSalary: { before: null, after: finalized.finalSalary } }, note.trim()),
  ];
  return replaceRequest(id, finalized) ?? requestOrThrow(id);
}
