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
  const { jobLevel: _untrustedJobLevel, ...trustedInput } = input;
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (now.getTime() - new Date(trustedInput.departureAt).getTime() > thirtyDaysMs) {
    throw new WorkflowServiceError("INVALID_DATE", "A request cannot be submitted for a trip that took place more than one month in the past.");
  }
  // Validate the selected manager: must reference a real user that has the manager role.
  const manager = trustedInput.managerId ? findUserById(trustedInput.managerId) : undefined;
  if (!manager || !manager.roles.includes("manager")) {
    throw new WorkflowServiceError("INVALID_EDIT_FIELDS", "managerId must reference a user with the manager role.");
  }

  // PDF Item 5 & 6: Auto calculate Tango fare for Employee's Private Car when amount is omitted.
  const isPersonalCar = trustedInput.transportationMethod.includes("personal-car") || trustedInput.transportationMethod.includes("Private Car") || trustedInput.transportationMethod.includes("العامل");
  let claimedCost = trustedInput.claimedTransportationCost ?? 0;
  if (isPersonalCar && claimedCost <= 0) {
    const tangoFare = getTangoFare(trustedInput.destinationCity);
    claimedCost = trustedInput.tripType === "round-trip" ? tangoFare * 2 : tangoFare;
  }

  // One-way trips must still provide a returnAt for schema compatibility, but the
  // salary preview only cares about the departure date — keep both timestamps.
  const id = requestId ?? standaloneRequestId(now);
  const salaryPreview = computeInitialSalaryPreview(
    trustedInput.departureAt,
    trustedInput.returnAt,
    trustedInput.accommodationType,
    user,
  );
  const submitEvent = createAuditEvent(
    id,
    user.id,
    "employee",
    "submit",
    null,
    "manager-review",
    { managerId: { before: null, after: manager.id }, tripType: { before: null, after: trustedInput.tripType } },
    null,
    { now },
  );

  return {
    ...trustedInput,
    id,
    employeeId: user.id,
    originCity: trustedInput.originCity ?? "Cairo",
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
    notes: trustedInput.notes ?? "",
    attachments: trustedInput.attachments ?? [],
    priceRevisions: [],
    pendingEmployeeResponse: false,
    timeNeedsVerification: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    auditEvents: [submitEvent],
    submittedRequest: structuredClone({ ...trustedInput, jobLevel: user.jobLevel }),
  };
}
