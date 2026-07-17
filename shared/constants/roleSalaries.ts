// shared/constants/roleSalaries.ts
import { JobLevel } from '../types/database';

// EGP per night based on the official Arabic documentation
export const BASE_RATES: Record<JobLevel, number> = {
  CHAIRMAN: 270,
  ASSISTANT: 240,
  GENERAL_MANAGER: 200,
  LEVEL_1: 140,
  LEVEL_2: 110,
  LEVEL_3: 60,
};

export const ACCOMMODATION_DEDUCTION: Record<AccommodationType, number> = {
  FULL_BOARD: 0.50, // 50% cut
  ROOM_ONLY: 0.25,  // 25% cut
  NONE: 0.00,       // 0% cut
};