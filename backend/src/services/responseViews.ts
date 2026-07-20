import type {
  SystemRole,
  TravelRequest,
} from "@travel-reimbursement/shared";
import { findUserById } from "../storage/memoryStore.js";

export type SafeRequestView = Record<string, unknown>;

function baseView(request: TravelRequest): SafeRequestView {
  const employee = findUserById(request.employeeId);
  return {
    id: request.id,
    employeeId: request.employeeId,
    employee: employee ? {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      displayName: employee.displayName,
      department: employee.department,
      jobLevel: employee.jobLevel,
    } : undefined,
    stage: request.stage,
    originCity: request.originCity,
    destinationCity: request.destinationCity,
    departureAt: request.departureAt,
    returnAt: request.returnAt,
    accommodationType: request.accommodationType,
    transportationMethod: request.transportationMethod,
    notes: request.notes,
    attachments: request.attachments,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function ownerView(request: TravelRequest): SafeRequestView {
  const view = {
    ...baseView(request),
    auditEvents: request.auditEvents.map((event) => ({ ...event, changes: {} })),
  };
  if (request.stage === "completed") {
    return { ...view, finalSalary: request.finalSalary };
  }
  if (request.stage === "cancelled") {
    return { ...view, cancellationReason: request.cancellationReason };
  }
  return view;
}

function departmentView(request: TravelRequest): SafeRequestView {
  return {
    ...baseView(request),
    verifiedDepartureAt: request.verifiedDepartureAt,
    verifiedReturnAt: request.verifiedReturnAt,
    verifiedSameDayHours: request.verifiedSameDayHours,
    verifiedReturnDayHours: request.verifiedReturnDayHours,
    salaryPreview: request.salaryPreview,
    priceRevisions: request.priceRevisions,
    cancellationReason: request.cancellationReason,
    auditEvents: request.auditEvents,
  };
}

function transportationView(request: TravelRequest): SafeRequestView {
  return { ...departmentView(request), transportationCost: request.transportationCost, claimedTransportationCost: request.claimedTransportationCost };
}

function salaryView(request: TravelRequest): SafeRequestView {
  return {
    ...departmentView(request),
    transportationCost: request.transportationCost,
    bonusAmount: request.bonusAmount,
    penaltyAmount: request.penaltyAmount,
    finalSalary: request.finalSalary,
    cancellationReason: request.cancellationReason,
    claimedTransportationCost: request.claimedTransportationCost,
  };
}

/** Ownership takes priority so dual-role users cannot inspect their own intermediate amounts. */
export function authorizedView(
  request: TravelRequest,
  viewerId: string,
  viewerRoles: readonly SystemRole[],
  departmentContext = false,
): SafeRequestView {
  if (request.employeeId === viewerId && !departmentContext) return ownerView(request);
  if (viewerRoles.includes("salary")) return salaryView(request);
  if (viewerRoles.includes("transportation")) return transportationView(request);
  if (viewerRoles.some((role) => role === "manager" || role === "pr" || role === "timing")) {
    return departmentView(request);
  }
  return { id: request.id, stage: request.stage, createdAt: request.createdAt, updatedAt: request.updatedAt };
}
