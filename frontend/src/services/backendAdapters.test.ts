import { describe, expect, it } from "vitest";
import type { SalaryCalculationResult } from "@travel-reimbursement/shared";

import { mapBackendRequest } from "./requestApi";
import { mapBackendSalaryItem } from "./salaryApi";
import { mapBackendQueueItem } from "./workflowApi";

const calculation: SalaryCalculationResult = {
  dailyRate: 140,
  overnightCount: 1,
  overnightAmount: 140,
  sameDayAmount: 0,
  returnDayAmount: 42,
  transportationCost: 100,
  bonusAmount: 0,
  penaltyAmount: 0,
  totalAmount: 282,
};

const backendRecord = {
  id: "TR-API-1",
  employeeId: "u1",
  employee: { id: "u1", employeeNumber: "DEV001", displayName: "Demo Employee", department: "Operations", jobLevel: "Level 1" as const },
  originCity: "Cairo",
  destinationCity: "Suez",
  departureAt: "2026-08-01T06:00:00.000Z",
  returnAt: "2026-08-02T18:00:00.000Z",
  accommodationType: "none" as const,
  transportationMethod: "Train",
  stage: "salary-finalization" as const,
  salaryPreview: calculation,
  verifiedSameDayHours: 0,
  verifiedReturnDayHours: 7,
  priceRevisions: [],
  attachments: [],
  createdAt: "2026-07-20T08:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
};

describe("backend response adapters", () => {
  it("maps owner request envelopes into the request list/detail model", () => {
    expect(mapBackendRequest({ ...backendRecord, finalSalary: calculation, stage: "completed", auditEvents: [] })).toMatchObject({ status: "completed", finalPrice: 282, originCity: "Cairo", employee: { department: "Operations" } });
  });

  it("maps a department queue record with server calculations", () => {
    expect(mapBackendQueueItem({ ...backendRecord, stage: "timing-review" })).toMatchObject({ currentStage: "timing-review", currentPrice: 282, employeeJobLevel: "Level 1" });
  });

  it("maps a Salary record into the Salary workspace model", () => {
    expect(mapBackendSalaryItem(backendRecord)).toMatchObject({ status: "pending", calculation: { totalAmount: 282 }, employee: { employeeNumber: "DEV001" } });
  });
});
