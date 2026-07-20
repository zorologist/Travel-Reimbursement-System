import { describe, expect, it } from "vitest";

import {
  SALARY_RATES,
  LoginInputSchema,
  RequestAttachmentSchema,
  ApproveRequestInputSchema,
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

  it("validates authentication, attachments, and workflow actions", () => {
    expect(LoginInputSchema.parse({ employeeNumber: " DEV001 ", password: "Employee@123" })).toMatchObject({ employeeNumber: "DEV001", remember: false });
    expect(RequestAttachmentSchema.parse({ id: "a1", name: "ticket.pdf", mimeType: "application/pdf", size: 100, url: "data:application/pdf;base64,JVBERi0=" }).name).toBe("ticket.pdf");
    expect(ApproveRequestInputSchema.parse({ accommodationType: "room-only", reason: "Confirmed" })).toMatchObject({ accommodationType: "room-only" });
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
