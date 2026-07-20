import { describe, expect, it } from "vitest";
import type { CreateTravelRequestInput, User } from "@travel-reimbursement/shared";

import { createNewRequest } from "../services/requestService.js";

const employee: User = {
  id: "employee-test",
  employeeNumber: "TEST001",
  displayName: "Test Employee",
  department: "Testing",
  jobLevel: "Level 1",
  roles: ["employee"],
};

const input: CreateTravelRequestInput = {
  destinationCity: "Suez",
  departureAt: "2027-03-01T08:00:00.000Z",
  returnAt: "2027-03-03T18:00:00.000Z",
  accommodationType: "none",
  transportationMethod: "Company bus",
};

describe("request lifecycle creation service", () => {
  it("creates server-owned identity, workflow, calculation, and audit fields", () => {
    const request = createNewRequest(input, employee);
    expect(request).toMatchObject({
      employeeId: employee.id,
      stage: "manager-review",
      destinationCity: "Suez",
      verifiedDepartureAt: null,
      transportationCost: 0,
      finalSalary: null,
    });
    expect(request.id).not.toBe("");
    expect(request.salaryPreview.totalAmount).toBe(280);
    expect(request.auditEvents).toHaveLength(1);
    expect(request.auditEvents[0]).toMatchObject({
      actorId: employee.id,
      actorRole: "employee",
      action: "submit",
      toStage: "manager-review",
    });
  });

  it("uses employee as the submission role for dual-role staff", () => {
    const request = createNewRequest(input, { ...employee, roles: ["employee", "manager"] });
    expect(request.auditEvents[0].actorRole).toBe("employee");
  });

  it("rejects requests created after their departure time", () => {
    expect(() => createNewRequest({ ...input, departureAt: "2025-01-01T08:00:00.000Z" }, employee)).toThrow(/before its departure/);
  });

  it("generates a unique ID for every request", () => {
    expect(createNewRequest(input, employee).id).not.toBe(createNewRequest(input, employee).id);
  });
});
