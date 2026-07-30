import type { JobLevel } from "../types/User.js";
import type { AccommodationType, SalaryCalculationResult } from "../types/TravelRequest.js";
import { ACCOMMODATION_FACTORS, SALARY_RATES } from "../constants/salaryRates.js";

export interface SalaryCalculationInput {
  jobLevel: JobLevel;
  accommodationType: AccommodationType;
  overnightCount: number;
  isSameDayMission: boolean;
  sameDayVerifiedHours: number;
  returnDayVerifiedHours: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
}

/**
 * Rounds a number to two decimal places.
 */
const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the salary breakdown based on the provided rules.
 * This is a pure function.
 */
export function calculateSalary(input: SalaryCalculationInput): SalaryCalculationResult {
  // Validate inputs
  const numericInputs = {
    overnightCount: input.overnightCount,
    sameDayVerifiedHours: input.sameDayVerifiedHours,
    returnDayVerifiedHours: input.returnDayVerifiedHours,
    transportationCost: input.transportationCost,
    bonusAmount: input.bonusAmount,
    penaltyAmount: input.penaltyAmount,
  };
  for (const [field, value] of Object.entries(numericInputs)) {
    if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
    if (value < 0) throw new Error(`${field} cannot be negative`);
  }
  if (!Number.isInteger(input.overnightCount)) {
    throw new Error("overnightCount must be an integer");
  }

  const dailyRate = SALARY_RATES[input.jobLevel];
  const accommodationFactor = ACCOMMODATION_FACTORS[input.accommodationType];

  let overnightAmount = 0;
  let sameDayAmount = 0;
  let returnDayAmount = 0;

  if (input.isSameDayMission) {
    // Same-day mission: overnightCount must be zero, and returnDayAmount must not apply.
    if (input.sameDayVerifiedHours >= 7) {
      sameDayAmount = dailyRate * 0.5;
    }
  } else {
    // Overnight request
    overnightAmount = dailyRate * input.overnightCount * accommodationFactor;

    // Return day rule: at least 7 verified hours receives 30% of the daily rate.
    // Accommodation deductions do not apply to the return-day allowance.
    if (input.returnDayVerifiedHours >= 7) {
      returnDayAmount = dailyRate * 0.3;
    }
  }

  const totalAmount =
    overnightAmount +
    sameDayAmount +
    returnDayAmount +
    input.transportationCost +
    input.bonusAmount -
    input.penaltyAmount;

  return {
    dailyRate: round(dailyRate),
    overnightCount: input.overnightCount,
    overnightAmount: round(overnightAmount),
    sameDayAmount: round(sameDayAmount),
    returnDayAmount: round(returnDayAmount),
    transportationCost: round(input.transportationCost),
    bonusAmount: round(input.bonusAmount),
    penaltyAmount: round(input.penaltyAmount),
    totalAmount: round(totalAmount),
  };
}
