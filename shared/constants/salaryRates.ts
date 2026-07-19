import type { JobLevel } from "../types/User.js";

/**
 * Daily allowance by job level (EGP). Confirmed against the official policy
 * table (جدول فئات بدل السفر والشروط) — rate is by JOB LEVEL, not by
 * destination city. This supersedes the earlier city-based daily-rate draft
 * in the original project guide.
 */
export const SALARY_RATES: Record<JobLevel, number> = {
  Chairman: 270,
  Deputy: 270,
  Advisor: 270,
  Expert: 270,
  Assistant: 240,
  "Deputy Assistant": 240,
  "General Manager": 200,
  "Assistant General Manager": 200,
  "Level 1": 140,
  "Level 2": 110,
  "Level 3": 60,
};

/**
 * Accommodation reduces the daily rate to this factor. Confirmed against the
 * policy table: room-only (no food) = -25% → 0.75; room-and-food = -50% → 0.5.
 */
export const ACCOMMODATION_FACTORS = {
  none: 1.0,
  "room-only": 0.75,
  "room-and-food": 0.5,
} as const;

/** Return-day allowance is always 30% of the daily rate, regardless of accommodation. */
export const RETURN_DAY_FACTOR = 0.3;

/** Same-day (no overnight) missions earn 50% of the daily rate. */
export const SAME_DAY_FACTOR = 0.5;

/** Minimum verified hours required to earn the same-day or return-day allowance. */
export const MINIMUM_QUALIFYING_HOURS = 7;