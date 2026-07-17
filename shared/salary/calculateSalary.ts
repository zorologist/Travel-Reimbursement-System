import { JobLevel } from "../types/User";
import { AccommodationType, SalaryCalculationResult } from "../types/TravelRequest";
import { SALARY_RATES, ACCOMMODATION_FACTORS } from "../constants/salaryRates";

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
  if (input.overnightCount < 0) throw new Error("overnightCount cannot be negative");
  if (input.sameDayVerifiedHours < 0) throw new Error("sameDayVerifiedHours cannot be negative");
  if (input.returnDayVerifiedHours < 0) throw new Error("returnDayVerifiedHours cannot be negative");
  if (input.transportationCost < 0) throw new Error("transportationCost cannot be negative");
  if (input.bonusAmount < 0) throw new Error("bonusAmount cannot be negative");
  if (input.penaltyAmount < 0) throw new Error("penaltyAmount cannot be negative");

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
