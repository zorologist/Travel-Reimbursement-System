import {
  calculateSalary,
  type AccommodationType,
  type SalaryCalculationResult,
  type TravelRequest,
  type User,
} from "@travel-reimbursement/shared";

function overnightCount(departureAt: string, returnAt: string): number {
  const departure = new Date(departureAt);
  const arrival = new Date(returnAt);
  const departureDay = Date.UTC(departure.getUTCFullYear(), departure.getUTCMonth(), departure.getUTCDate());
  const arrivalDay = Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), arrival.getUTCDate());
  return Math.max(0, Math.round((arrivalDay - departureDay) / 86_400_000));
}

export function computeInitialSalaryPreview(
  departureAt: string,
  returnAt: string,
  accommodationType: AccommodationType,
  employee: User,
): SalaryCalculationResult {
  const nights = overnightCount(departureAt, returnAt);
  return calculateSalary({
    jobLevel: employee.jobLevel,
    accommodationType,
    overnightCount: nights,
    isSameDayMission: nights === 0,
    sameDayVerifiedHours: 0,
    returnDayVerifiedHours: 0,
    transportationCost: 0,
    bonusAmount: 0,
    penaltyAmount: 0,
  });
}

export function recalculateSalaryPreview(
  request: TravelRequest,
  employee: User,
): SalaryCalculationResult {
  const departureAt = request.verifiedDepartureAt ?? request.departureAt;
  const returnAt = request.verifiedReturnAt ?? request.returnAt;
  const nights = overnightCount(departureAt, returnAt);
  return calculateSalary({
    jobLevel: employee.jobLevel,
    accommodationType: request.accommodationType,
    overnightCount: nights,
    isSameDayMission: nights === 0,
    sameDayVerifiedHours: request.verifiedSameDayHours,
    returnDayVerifiedHours: request.verifiedReturnDayHours,
    transportationCost: request.transportationCost,
    bonusAmount: request.bonusAmount,
    penaltyAmount: request.penaltyAmount,
  });
}
