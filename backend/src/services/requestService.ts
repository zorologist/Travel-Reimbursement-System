import {
  getTangoFare,
  type CreateTravelRequestInput,
  type TravelRequest,
  type User,
} from "@travel-reimbursement/shared";

import { findUserById } from "../storage/memoryStore.js";
import { computeInitialSalaryPreview } from "./salaryService.js";
import { createAuditEvent, WorkflowServiceError } from "./workflowService.js";

let standaloneSequence = 9000;

function standaloneRequestId(now: Date): string {
  standaloneSequence += 1;
  return `TR-${now.getUTCFullYear()}-${String(standaloneSequence).padStart(4, "0")}`;
}

/** Builds a submitted request while keeping identity, workflow, audit, and money server-controlled. */
export function createNewRequest(
  input: CreateTravelRequestInput,
  user: User,
  requestId?: string,
): TravelRequest {
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (now.getTime() - new Date(input.departureAt).getTime() > thirtyDaysMs) {
    throw new WorkflowServiceError("INVALID_DATE", "A request cannot be submitted for a trip that took place more than one month in the past.");
  }
  // Validate the selected manager: must reference a real user that has the manager role.
  const manager = input.managerId ? findUserById(input.managerId) : undefined;
  if (!manager || !manager.roles.includes("manager")) {
    throw new WorkflowServiceError("INVALID_EDIT_FIELDS", "managerId must reference a user with the manager role.");
  }

  // PDF Item 5 & 6: Auto calculate Tango fare for Employee's Private Car when amount is omitted.
  const isPersonalCar = input.transportationMethod.includes("personal-car") || input.transportationMethod.includes("Private Car") || input.transportationMethod.includes("العامل");
  let claimedCost = input.claimedTransportationCost ?? 0;
  if (isPersonalCar && claimedCost <= 0) {
    const tangoFare = getTangoFare(input.destinationCity);
    claimedCost = input.tripType === "round-trip" ? tangoFare * 2 : tangoFare;
  }

  // One-way trips must still provide a returnAt for schema compatibility, but the
  // salary preview only cares about the departure date — keep both timestamps.
  const id = requestId ?? standaloneRequestId(now);
  const effectiveUser: User = input.jobLevel ? { ...user, jobLevel: input.jobLevel } : user;
  const salaryPreview = computeInitialSalaryPreview(
    input.departureAt,
    input.returnAt,
    input.accommodationType,
    effectiveUser,
  );
  const submitEvent = createAuditEvent(
    id,
    user.id,
    "employee",
    "submit",
    null,
    "manager-review",
    { managerId: { before: null, after: manager.id }, tripType: { before: null, after: input.tripType } },
    null,
    { now },
  );

  return {
    ...input,
    id,
    employeeId: user.id,
    originCity: input.originCity ?? "Cairo",
    stage: "manager-review",
    verifiedDepartureAt: null,
    verifiedReturnAt: null,
    verifiedSameDayHours: salaryPreview.sameDayAmount > 0 ? 7 : 0,
    verifiedReturnDayHours: salaryPreview.returnDayAmount > 0 ? 7 : 0,
    transportationCost: 0,
    transportationCostVerified: false,
    claimedTransportationCost: claimedCost,
    bonusAmount: 0,
    penaltyAmount: 0,
    salaryPreview,
    finalSalary: null,
    cancellationReason: null,
    notes: input.notes ?? "",
    attachments: input.attachments ?? [],
    priceRevisions: [],
    pendingEmployeeResponse: false,
    timeNeedsVerification: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    auditEvents: [submitEvent],
    submittedRequest: structuredClone(input),
  };
}
