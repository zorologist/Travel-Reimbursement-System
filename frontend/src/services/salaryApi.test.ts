import { beforeEach, describe, expect, it } from "vitest";

import {
  resetSalaryDevelopmentDataForTests,
  salaryApi,
} from "./salaryApi";

beforeEach(() => {
  resetSalaryDevelopmentDataForTests();
});

describe("salary API development adapter", () => {
  it("returns salary-finalization records calculated by the shared rules", async () => {
    const queue = await salaryApi.listQueue();

    expect(queue).toHaveLength(4);
    expect(queue.find((item) => item.id === "TR-2026-0841")).toMatchObject({
      id: "TR-2026-0841",
      status: "pending",
      calculation: {
        dailyRate: 140,
        overnightAmount: 560,
        returnDayAmount: 42,
        transportationCost: 200,
        totalAmount: 802,
      },
    });
  });

  it("recalculates saved adjustments and records a salary revision", async () => {
    const updated = await salaryApi.updateAdjustments("TR-2026-0841", {
      transportationCost: 225,
      bonusAmount: 100,
      penaltyAmount: 20,
      note: "Approved mission adjustment.",
    });

    expect(updated.calculation).toMatchObject({
      bonusAmount: 100,
      penaltyAmount: 20,
      totalAmount: 907,
    });
    expect(updated.revisions.at(-1)).toMatchObject({
      department: "Payroll",
      previousPrice: 802,
      newPrice: 907,
      reason: "Approved mission adjustment.",
    });
  });

  it("allows a non-zero adjustment without an audit note", async () => {
    const updated = await salaryApi.updateAdjustments("TR-2026-0841", {
      transportationCost: 200,
      bonusAmount: 10,
      penaltyAmount: 0,
      note: "",
    });

    expect(updated.calculation.bonusAmount).toBe(10);
  });

  it("removes finalized records from the pending queue", async () => {
    const finalized = await salaryApi.finalize(
      "TR-2026-0841",
      "",
    );
    const queue = await salaryApi.listQueue();

    expect(finalized.status).toBe("completed");
    expect(queue.map((item) => item.id)).not.toContain("TR-2026-0841");
  });
});
