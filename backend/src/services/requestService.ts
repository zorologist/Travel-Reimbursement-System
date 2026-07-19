import { randomUUID } from "node:crypto";
import type {
  CreateTravelRequestInput,
  SalaryCalculationResult,
  TravelRequest,
} from "../../../shared/types/TravelRequest.js";
import type { User } from "../../../shared/types/User.js";
import { submitRequest } from "./workflowService.js";

// ASSUMPTION / KNOWN GAP: shared/salary/calculateSalary.ts does not exist in the
// codebase yet (per README, it's planned but not implemented). Once it lands with
// a signature roughly like calculateSalary(params): SalaryCalculationResult, swap
// buildDraftSalaryPreview() below for a real call — do NOT duplicate the formula
// here, since shared/salary is supposed to be the single source of truth used by
// both the frontend preview and this backend.
function buildDraftSalaryPreview(): SalaryCalculationResult {
  return {
    dailyRate: 0,
    overnightCount: 0,
    overnightAmount: 0,
    sameDayAmount: 0,
    returnDayAmount: 0,
    transportationCost: 0,
    bonusAmount: 0,
    penaltyAmount: 0,
    totalAmount: 0,
  };
}

/**
 * Builds a brand-new request skeleton and immediately runs it through
 * workflowService.submitRequest so the "submit" audit event and departure-date
 * validation happen in one place, per the confirmed workflow rules.
 */
export function buildNewTravelRequest(input: CreateTravelRequestInput, employee: User): TravelRequest {
  const now = new Date().toISOString();

  const skeleton: TravelRequest = {
    ...input,
    id: randomUUID(),
    employeeId: employee.id,
    stage: "manager-review",
    verifiedDepartureAt: null,
    verifiedReturnAt: null,
    verifiedSameDayHours: 0,
    verifiedReturnDayHours: 0,
    transportationCost: 0,
    bonusAmount: 0,
    penaltyAmount: 0,
    salaryPreview: buildDraftSalaryPreview(),
    finalSalary: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
    auditEvents: [],
  };

  return submitRequest(skeleton, employee.id, "employee");
}