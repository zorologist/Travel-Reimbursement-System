import {
  getTangoFare,
  getTrainFare,
  isWithinTravelSubmissionWindow,
  type CreateTravelRequestInput,
  type TravelRequest,
  type User,
} from "@travel-reimbursement/shared";

import { appStore } from "../storage/appStore.js";
import { computeInitialSalaryPreview } from "./salaryService.js";
import { createAuditEvent, WorkflowServiceError } from "./workflowService.js";

let standaloneSequence = 9000;

function standaloneRequestId(now: Date): string {
  standaloneSequence += 1;
  return `TR-${now.getUTCFullYear()}-${String(standaloneSequence).padStart(4, "0")}`;
}

/** Builds a submitted request while keeping identity, workflow, audit, and money server-controlled. */
export async function createNewRequest(
  input: CreateTravelRequestInput,
  user: User,
  requestId?: string,
): Promise<TravelRequest> {
  const { jobLevel, ...trustedInput } = input;
  if (!jobLevel) {
    throw new WorkflowServiceError("INVALID_EDIT_FIELDS", "A job level must be selected for the request.");
  }
  const now = new Date();
  if (!isWithinTravelSubmissionWindow(trustedInput.departureAt, now)) {
    throw new WorkflowServiceError("INVALID_DATE", "A request cannot be submitted for a trip that took place more than one month in the past.");
  }
  // Validate the selected manager: must reference a real user that has the manager role.
  const manager = trustedInput.managerId ? await appStore.findUserById(trustedInput.managerId) : undefined;
  if (!manager || !manager.roles.includes("manager")) {
    throw new WorkflowServiceError("INVALID_EDIT_FIELDS", "managerId must reference a user with the manager role.");
  }

  // PDF Item 5 & 6: Auto calculate Tango fare for Employee's Private Car when amount is omitted.
  const isPersonalCar = trustedInput.transportationMethod.includes("personal-car") || trustedInput.transportationMethod.includes("Private Car") || trustedInput.transportationMethod.includes("العامل");
  const isCompanyCar = trustedInput.transportationMethod.includes("company-car") || trustedInput.transportationMethod.includes("Company Car") || trustedInput.transportationMethod.includes("سيارة الشركة");
  let claimedCost = trustedInput.claimedTransportationCost ?? 0;
  if (isPersonalCar && claimedCost <= 0) {
    const tangoFare = getTangoFare(trustedInput.destinationCity);
    claimedCost = trustedInput.tripType === "round-trip" ? tangoFare * 2 : tangoFare;
  } else if (isCompanyCar && claimedCost <= 0) {
    const trainFare = getTrainFare(trustedInput.destinationCity);
    claimedCost = trustedInput.tripType === "round-trip" ? trainFare * 2 : trainFare;
  }

  // One-way trips must still provide a returnAt for schema compatibility, but the
  // salary preview only cares about the departure date — keep both timestamps.
  const id = requestId ?? standaloneRequestId(now);
  const employeeAtSubmission: User = { ...user, jobLevel };
  const salaryPreview = computeInitialSalaryPreview(
    trustedInput.departureAt,
    trustedInput.returnAt,
    trustedInput.accommodationType,
    employeeAtSubmission,
  );
  const submitEvent = createAuditEvent(
    id,
    user.id,
    "employee",
    "submit",
    null,
    "manager-review",
    {
      managerId: { before: null, after: manager.id },
      tripType: { before: null, after: trustedInput.tripType },
      jobLevel: { before: null, after: jobLevel },
    },
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
    submittedRequest: structuredClone({ ...trustedInput, jobLevel }),
  };
}
