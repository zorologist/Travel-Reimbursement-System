import type {
  SystemRole,
  TravelRequest,
} from "@travel-reimbursement/shared";
import { appStore } from "../storage/appStore.js";

export type SafeRequestView = Record<string, unknown>;

async function baseView(request: TravelRequest): Promise<SafeRequestView> {
  const employee = await appStore.findUserById(request.employeeId);
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
    tripType: request.tripType,
    managerId: request.managerId,
    accommodationType: request.accommodationType,
    transportationMethod: request.transportationMethod,
    notes: request.notes,
    attachments: request.attachments,
    pendingEmployeeResponse: request.pendingEmployeeResponse,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

/** Owner-facing summary of a price revision — exposes only the high-level fields the
 * employee needs to see (no internal calculation breakdown, no raw change set). */
async function ownerView(request: TravelRequest): Promise<SafeRequestView> {
  const view = {
    ...await baseView(request),
    // Employees track stages only. Internal comments, audit history, calculations,
    // and revision amounts remain server-side until the final total is approved.
    auditEvents: [],
  };
  if (request.stage === "completed") {
    return { ...view, finalSalary: request.finalSalary };
  }
  if (request.stage === "cancelled") {
    return { ...view, cancellationReason: request.cancellationReason };
  }
  return view;
}

async function departmentView(request: TravelRequest): Promise<SafeRequestView> {
  return {
    ...await baseView(request),
    verifiedDepartureAt: request.verifiedDepartureAt,
    verifiedReturnAt: request.verifiedReturnAt,
    verifiedSameDayHours: request.verifiedSameDayHours,
    verifiedReturnDayHours: request.verifiedReturnDayHours,
    salaryPreview: request.salaryPreview,
    priceRevisions: request.priceRevisions,
    cancellationReason: request.cancellationReason,
    auditEvents: request.auditEvents,
    timeNeedsVerification: request.timeNeedsVerification,
    submittedRequest: request.submittedRequest,
  };
}

const FINANCIAL_CHANGE_FIELDS = new Set([
  "salaryPreview", "finalSalary", "transportationCost", "claimedTransportationCost",
  "bonusAmount", "penaltyAmount",
]);

async function prView(request: TravelRequest): Promise<SafeRequestView> {
  return {
    ...await baseView(request),
    cancellationReason: request.cancellationReason,
    auditEvents: request.auditEvents.map((event) => ({
      ...event,
      note: event.actorRole === "salary" ? null : event.note,
      changes: Object.fromEntries(Object.entries(event.changes).filter(([field]) => !FINANCIAL_CHANGE_FIELDS.has(field))),
    })),
  };
}

async function transportationView(request: TravelRequest): Promise<SafeRequestView> {
  return { ...await departmentView(request), transportationCost: request.transportationCost, claimedTransportationCost: request.claimedTransportationCost };
}

async function salaryView(request: TravelRequest): Promise<SafeRequestView> {
  return {
    ...await departmentView(request),
    transportationCost: request.transportationCost,
    bonusAmount: request.bonusAmount,
    penaltyAmount: request.penaltyAmount,
    finalSalary: request.finalSalary,
    cancellationReason: request.cancellationReason,
    claimedTransportationCost: request.claimedTransportationCost,
    transportationCostVerified: request.transportationCostVerified,
    submittedRequest: request.submittedRequest,
  };
}

/** Ownership takes priority so dual-role users cannot inspect their own intermediate amounts. */
export async function authorizedView(
  request: TravelRequest,
  viewerId: string,
  viewerRoles: readonly SystemRole[],
  departmentContext = false,
): Promise<SafeRequestView> {
  if (request.employeeId === viewerId && !departmentContext) return ownerView(request);
  if (viewerRoles.includes("salary")) return salaryView(request);
  if (viewerRoles.includes("pr")) return prView(request);
  if (viewerRoles.includes("transportation")) return transportationView(request);
  if (viewerRoles.some((role) => role === "manager" || role === "timing")) {
    return departmentView(request);
  }
  return { id: request.id, stage: request.stage, createdAt: request.createdAt, updatedAt: request.updatedAt };
}
