import { beforeEach, describe, expect, it } from "vitest";

import { developmentRepository, resetDevelopmentRepositoryForTests } from "./developmentRepository";

beforeEach(() => resetDevelopmentRepositoryForTests());

describe("integrated frontend development repository", () => {
  it("creates an employee request at manager review with an audit event", async () => {
    const attachment = { id: "receipt-1", name: "receipt.pdf", mimeType: "application/pdf", size: 512, url: "data:application/pdf;base64,JVBERi0=" };
    const created = await developmentRepository.create({ employeeId: "u1", originCity: "Cairo", destinationCity: "Suez", departureAt: "2026-09-01T06:00:00.000Z", returnAt: "2026-09-02T17:00:00.000Z", accommodationType: "none", transportationMethod: "Company car", transportationCost: 120, notes: "Site visit", attachments: [attachment] });
    expect(created).toMatchObject({ employeeId: "u1", stage: "manager-review", originCity: "Cairo", destinationCity: "Suez" });
    expect(created.attachments).toEqual([attachment]);
    expect(created.auditEvents.at(-1)).toMatchObject({ action: "submit", actorRole: "employee" });
  });

  it("provides submitted attachments to transportation and stores PR comments", async () => {
    const transportationQueue = await developmentRepository.queueForRole("transportation");
    expect(transportationQueue.find((request) => request.id === "TR-2026-003")?.attachments[0]).toMatchObject({ name: "train-ticket-TR-2026-003.txt" });

    const reviewed = await developmentRepository.approve("TR-2026-002", "pr", { note: "Hotel booking confirmed with the employee." });
    expect(reviewed.auditEvents.at(-1)).toMatchObject({ actorRole: "pr", note: "Hotel booking confirmed with the employee." });
  });

  it("moves a request through only the matching department", async () => {
    await expect(developmentRepository.approve("TR-2026-001", "pr", {})).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    const approved = await developmentRepository.approve("TR-2026-001", "manager", { note: "Business need confirmed." });
    expect(approved.stage).toBe("pr-review");
  });

  it("enforces manager-only rejection", async () => {
    await expect(developmentRepository.reject("TR-2026-002", "pr", "Not valid")).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("locks a finalized salary request and stores the final result", async () => {
    const finalized = await developmentRepository.finalizeSalary("TR-2026-0841", "Verified and approved.");
    expect(finalized.stage).toBe("completed");
    expect(finalized.finalSalary?.totalAmount).toBe(802);
    await expect(developmentRepository.finalizeSalary("TR-2026-0841", "Again")).rejects.toMatchObject({ code: "REQUEST_ALREADY_COMPLETED" });
  });
});
