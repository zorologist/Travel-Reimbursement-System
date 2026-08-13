import type { JobLevel } from "../types/User.js";
import type { AccommodationType } from "../types/TravelRequest.js";

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

export interface JobLevelOption {
  value: JobLevel;
  arabic: string;
  english: string;
  dailyRate: number;
}

export const JOB_LEVEL_OPTIONS: readonly JobLevelOption[] = [
  { value: "Chairman", arabic: "رئيس مجلس الإدارة", english: "Chairman", dailyRate: 270 },
  { value: "Deputy", arabic: "نائب", english: "Deputy", dailyRate: 270 },
  { value: "Advisor", arabic: "مستشار", english: "Advisor", dailyRate: 270 },
  { value: "Expert", arabic: "خبير", english: "Expert", dailyRate: 270 },
  { value: "Assistant", arabic: "مساعد", english: "Assistant", dailyRate: 240 },
  { value: "Deputy Assistant", arabic: "مساعد نائب", english: "Deputy Assistant", dailyRate: 240 },
  { value: "General Manager", arabic: "مدير عام", english: "General Manager", dailyRate: 200 },
  { value: "Assistant General Manager", arabic: "مدير عام مساعد", english: "Assistant General Manager", dailyRate: 200 },
  { value: "Level 1", arabic: "المستوى الأول", english: "Level 1", dailyRate: 140 },
  { value: "Level 2", arabic: "المستوى الثاني", english: "Level 2", dailyRate: 110 },
  { value: "Level 3", arabic: "المستوى الثالث", english: "Level 3", dailyRate: 60 },
] as const;

export const ACCOMMODATION_FACTORS: Record<AccommodationType, number> = {
  none: 1.0,
  "room-only": 0.75,
  "room-and-food": 0.5,
  "half-board": 0.625,
  "bed-and-breakfast": 0.5,
  "egas-arranged": 0.5,
  "other-company-arranged": 0.5,
  "employee-arranged": 1.0,
} as const;
