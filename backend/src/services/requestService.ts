import { randomUUID } from "node:crypto";
import type {
  CreateTravelRequestInput,
  TravelRequest,
  User,
} from "@travel-reimbursement/shared";

import { computeInitialSalaryPreview } from "./salaryService.js";
import { createAuditEvent, WorkflowServiceError } from "./workflowService.js";

/** Builds a submitted request while keeping identity, workflow, audit, and money server-controlled. */
export function createNewRequest(
  input: CreateTravelRequestInput,
  user: User,
): TravelRequest {
  const now = new Date();
  if (new Date(input.departureAt).getTime() <= now.getTime()) {
    throw new WorkflowServiceError("INVALID_DATE", "A request must be created before its departure time.");
  }
  const id = randomUUID();
  const salaryPreview = computeInitialSalaryPreview(
    input.departureAt,
    input.returnAt,
    input.accommodationType,
    user,
  );
  const submitEvent = createAuditEvent(
    id,
    user.id,
    "employee",
    "submit",
    null,
    "manager-review",
    {},
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
    verifiedSameDayHours: 0,
    verifiedReturnDayHours: 0,
    transportationCost: 0,
    claimedTransportationCost: input.claimedTransportationCost ?? 0,
    bonusAmount: 0,
    penaltyAmount: 0,
    salaryPreview,
    finalSalary: null,
    cancellationReason: null,
    notes: input.notes ?? "",
    attachments: input.attachments ?? [],
    priceRevisions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    auditEvents: [submitEvent],
  };
}
