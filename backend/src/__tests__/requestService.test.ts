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
  tripType: "round-trip",
  managerId: "u4",
  accommodationType: "none",
  transportationMethod: "Company bus",
  attachments: [{ id: "ticket-1", name: "ticket.jpg", mimeType: "image/jpeg", size: 4, url: "data:image/jpeg;base64,AA==" }],
};

describe("request lifecycle creation service", () => {
  it("creates server-owned identity, workflow, calculation, and audit fields", async () => {
    const request = await createNewRequest(input, employee);
    expect(request).toMatchObject({
      employeeId: employee.id,
      stage: "manager-review",
      destinationCity: "Suez",
      verifiedDepartureAt: null,
      transportationCost: 0,
      finalSalary: null,
    });
    expect(request.id).not.toBe("");
    expect(request.id).toMatch(/^TR-\d{4}-\d{4,}$/);
    expect(request.salaryPreview.totalAmount).toBe(322);
    expect(request.auditEvents).toHaveLength(1);
    expect(request.auditEvents[0]).toMatchObject({
      actorId: employee.id,
      actorRole: "employee",
      action: "submit",
      toStage: "manager-review",
    });
  });

  it("uses employee as the submission role for dual-role staff", async () => {
    const request = await createNewRequest(input, { ...employee, roles: ["employee", "manager"] });
    expect(request.auditEvents[0].actorRole).toBe("employee");
  });

  it("uses and snapshots the trusted employee profile job level", async () => {
    const request = await createNewRequest({ ...input, jobLevel: "Chairman" }, employee);
    expect(request.jobLevel).toBeUndefined();
    expect(request.submittedRequest.jobLevel).toBe("Level 1");
    expect(request.salaryPreview.dailyRate).toBe(140);
  });

  it("rejects requests created more than one month in the past", async () => {
    await expect(createNewRequest({ ...input, departureAt: "2020-01-01T08:00:00.000Z" }, employee)).rejects.toThrow(/more than one month in the past/);
  });

  it("generates a unique ID for every request", async () => {
    expect((await createNewRequest(input, employee)).id).not.toBe((await createNewRequest(input, employee)).id);
  });
});
