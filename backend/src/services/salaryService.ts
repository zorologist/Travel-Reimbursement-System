import type { TravelRequest } from "../../../shared/types/TravelRequest.js";
import type { User } from "../../../shared/types/User.js";
import { calculateSalary, type SalaryCalculationInput } from "../../../shared/salary/calculateSalary.js";
import { updateRequest } from "../storage/memoryStore.js";

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function nightsBetween(departure: Date, returnAt: Date): number {
  const ms = returnAt.getTime() - departure.getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

/**
 * Builds calculator input from STORED and VERIFIED request fields only —
 * never from a total or breakdown the browser might send. Before Timing
 * verifies the trip, verifiedDepartureAt/verifiedReturnAt/verifiedHours are
 * null/0, so this naturally produces the unverified preview; once Timing
 * fills them in, the same function produces the verified figure with no
 * separate "preview vs final" branch of logic to keep in sync.
 *
 * ASSUMPTION: whether a mission is "same-day" is derived by comparing
 * departure/return dates rather than read off a stored flag, since
 * TravelRequest has no explicit isSameDayMission field. Confirm with the
 * shared developer if that derivation should instead be an explicit,
 * employee-set field.
 */
export function buildCalculatorInput(request: TravelRequest, employee: User): SalaryCalculationInput {
  const departure = new Date(request.verifiedDepartureAt ?? request.departureAt);
  const returnAt = new Date(request.verifiedReturnAt ?? request.returnAt);
  const isSameDayMission = isSameCalendarDay(departure, returnAt);

  return {
    jobLevel: employee.jobLevel,
    accommodationType: request.accommodationType,
    overnightCount: isSameDayMission ? 0 : nightsBetween(departure, returnAt),
    isSameDayMission,
    sameDayVerifiedHours: request.verifiedSameDayHours,
    returnDayVerifiedHours: request.verifiedReturnDayHours,
    transportationCost: request.transportationCost,
    bonusAmount: request.bonusAmount,
    penaltyAmount: request.penaltyAmount,
  };
}

/**
 * Recomputes and persists request.salaryPreview. Call this after any edit
 * that can change the amount: PR accommodation changes, Transportation cost
 * changes, Timing verification, or Salary bonus/penalty changes — per the
 * backend guide's "Recalculate after" list.
 *
 * INTEGRATION NOTE: workflowService.editRequest does not currently call this.
 * Per the guide's dependency table, workflowService should depend on
 * salaryService (not the other way around) — so the recalculation call
 * belongs inside editRequest, right after the field edits are applied and
 * before the audit event is recorded, so the audit event can show the
 * before/after salary change too.
 */
export function recalculateSalaryPreview(request: TravelRequest, employee: User): TravelRequest {
  const salaryPreview = calculateSalary(buildCalculatorInput(request, employee));
  return updateRequest({ ...request, salaryPreview, updatedAt: new Date().toISOString() });
}

/**
 * Computes and locks request.finalSalary. This does NOT check workflow
 * permissions itself — the caller (workflowService.finalizeRequest) must
 * already have verified canFinalize() before calling this, per the layer
 * dependency rule that services don't re-check each other's authorization.
 *
 * INTEGRATION NOTE: this closes the gap flagged earlier — the current
 * finalizeRequest in workflowService.ts transitions the stage to "completed"
 * but never populates finalSalary. It should call this function (or be
 * merged with it) before persisting.
 */
export function finalizeSalary(request: TravelRequest, employee: User): TravelRequest {
  const finalSalary = calculateSalary(buildCalculatorInput(request, employee));
  return updateRequest({ ...request, finalSalary, updatedAt: new Date().toISOString() });
}