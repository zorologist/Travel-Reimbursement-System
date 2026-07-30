import {
  calculateSalary,
  type AccommodationType,
  type SalaryCalculationResult,
  type TravelRequest,
  type User,
} from "@travel-reimbursement/shared";

const COMPANY_TIMEZONE = "Africa/Cairo";
const cairoDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: COMPANY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function localParts(value: string) {
  const parts = Object.fromEntries(
    cairoDateTime
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

function overnightCount(departureAt: string, returnAt: string): number {
  const departure = localParts(departureAt);
  const arrival = localParts(returnAt);
  const departureDay = Date.UTC(departure.year, departure.month - 1, departure.day);
  const arrivalDay = Date.UTC(arrival.year, arrival.month - 1, arrival.day);
  return Math.max(0, Math.round((arrivalDay - departureDay) / 86_400_000));
}

function returnDayHours(returnAt: string): number {
  const arrival = localParts(returnAt);
  const hours = arrival.hour + arrival.minute / 60;
  // Constant start time on the last day is 08:00 AM (8.0).
  // Returning at 3:00 PM (15.0) or later equals 7+ hours (15 - 8 = 7).
  return Math.max(0, hours - 8);
}

export function computeInitialSalaryPreview(
  departureAt: string,
  returnAt: string,
  accommodationType: AccommodationType,
  employee: User,
): SalaryCalculationResult {
  const nights = overnightCount(departureAt, returnAt);
  const initialReturnHours = nights > 0 ? returnDayHours(returnAt) : 0;
  return calculateSalary({
    jobLevel: employee.jobLevel,
    accommodationType,
    overnightCount: nights,
    isSameDayMission: nights === 0,
    sameDayVerifiedHours: 0,
    returnDayVerifiedHours: initialReturnHours,
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
  const employeeAtSubmission: User = {
    ...employee,
    jobLevel: request.submittedRequest.jobLevel ?? employee.jobLevel,
  };
  return calculateSalary({
    jobLevel: employeeAtSubmission.jobLevel,
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
