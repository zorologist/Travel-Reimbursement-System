import type { JobLevel } from "../types/User.js";

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

export const ACCOMMODATION_FACTORS = {
  none: 1.0,
  "room-only": 0.75,
  "room-and-food": 0.5,
  "half-board": 0.625, // TODO: confirm real business value — placeholder midpoint between room-only (0.75) and room-and-food (0.5).
  "bed-and-breakfast": 0.5,
} as const;
