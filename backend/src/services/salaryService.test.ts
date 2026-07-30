import { describe, expect, it } from "vitest";

import { findUserByEmployeeNumber } from "../storage/memoryStore.js";
import { computeInitialSalaryPreview } from "./salaryService.js";

describe("salary dates in the company timezone", () => {
  it("applies the 15:00 Cairo return-day threshold to ISO instants", () => {
    const employee = findUserByEmployeeNumber("DEV001")!;
    const calculation = computeInitialSalaryPreview(
      "2026-07-30T05:00:00.000Z", // 08:00 Africa/Cairo
      "2026-07-31T12:00:00.000Z", // 15:00 Africa/Cairo
      "none",
      employee,
    );

    expect(calculation.overnightCount).toBe(1);
    expect(calculation.returnDayAmount).toBe(42);
    expect(calculation.totalAmount).toBe(182);
  });
});
