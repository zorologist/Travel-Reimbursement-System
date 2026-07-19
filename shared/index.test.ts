import { describe, expect, it } from "vitest";

import {
  SALARY_RATES,
  TravelRequestSchema,
  UserSchema,
  WorkflowStageSchema,
  calculateSalary,
  type TravelRequest,
  type User,
  type WorkflowStage,
} from "./index.js";

describe("shared package public entry point", () => {
  it("exports the stable runtime schemas and constants", () => {
    expect(UserSchema).toBeDefined();
    expect(TravelRequestSchema).toBeDefined();
    expect(WorkflowStageSchema.parse("manager-review")).toBe("manager-review");
    expect(SALARY_RATES["Level 1"]).toBe(140);
  });

  it("exports the salary calculator", () => {
    const result = calculateSalary({
      jobLevel: "Level 1",
      accommodationType: "none",
      overnightCount: 0,
      isSameDayMission: true,
      sameDayVerifiedHours: 7,
      returnDayVerifiedHours: 0,
      transportationCost: 100,
      bonusAmount: 0,
      penaltyAmount: 0,
    });

    expect(result.totalAmount).toBe(170);
  });

  it("exports the stable TypeScript contracts", () => {
    const stage: WorkflowStage = "manager-review";
    const user = {} as User;
    const request = {} as TravelRequest;

    expect(stage).toBe("manager-review");
    expect(user).toBeDefined();
    expect(request).toBeDefined();
  });
});
