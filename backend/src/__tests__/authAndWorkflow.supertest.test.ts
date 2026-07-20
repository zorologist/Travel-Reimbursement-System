import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { resetSessionsForTests } from "../services/authService.js";
import { resetStoreForTests } from "../storage/memoryStore.js";

function as(employeeNumber: string) {
  return { "x-employee-number": employeeNumber };
}

beforeEach(() => {
  resetStoreForTests();
  resetSessionsForTests();
});

describe("development authentication", () => {
  it("logs in, restores the server session, and logs out", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({ employeeNumber: "dev004", password: "Admin@123", remember: true });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(login.body.user).toMatchObject({ employeeNumber: "DEV004", department: "Pipeline Engineering", roles: ["employee", "manager"] });

    const current = await agent.get("/api/auth/me");
    expect(current.status).toBe(200);
    expect(current.body.user.id).toBe("u4");

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("rejects invalid credentials without exposing which field failed", async () => {
    const response = await request(app).post("/api/auth/login").send({ employeeNumber: "DEV001", password: "wrong" });
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: "INVALID_CREDENTIALS", message: "The employee number or password is incorrect." });
  });
});

describe("complete workflow HTTP journey", () => {
  it("moves one request through every department, records revisions, finalizes, and reveals only the final amount to its owner", async () => {
    const manager = await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV004")).send({ reason: "Mission approved." });
    expect(manager.status).toBe(200);
    expect(manager.body.request.stage).toBe("pr-review");

    const pr = await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV005")).send({ accommodationType: "room-only", reason: "Company room confirmed." });
    expect(pr.status).toBe(200);
    expect(pr.body.request.stage).toBe("transportation-review");
    expect(pr.body.request.priceRevisions).toHaveLength(1);
    expect(pr.body.request.auditEvents.at(-1).note).toBe("Company room confirmed.");

    const transportation = await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV006")).send({ destination: "Alexandria", method: "Train", transportationCost: 250, reason: "Ticket and receipt verified." });
    expect(transportation.status).toBe(200);
    expect(transportation.body.request.stage).toBe("timing-review");
    expect(transportation.body.request.attachments).toEqual([]);

    const timing = await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV007")).send({ departureAt: "2026-08-03T06:00:00.000Z", returnAt: "2026-08-05T18:00:00.000Z", meetsSevenHourRule: true, reason: "Return-day attendance qualifies." });
    expect(timing.status).toBe(200);
    expect(timing.body.request.stage).toBe("salary-finalization");
    expect(timing.body.request.verifiedReturnDayHours).toBe(7);

    const adjusted = await request(app).patch("/api/requests/TR-2026-001/review").set(as("DEV008")).send({ bonusAmount: 25, penaltyAmount: 5, note: "Approved salary adjustment." });
    expect(adjusted.status).toBe(200);
    expect(adjusted.body.request.salaryPreview.bonusAmount).toBe(25);
    expect(adjusted.body.request.priceRevisions.length).toBeGreaterThanOrEqual(3);

    const ownerBefore = await request(app).get("/api/requests/TR-2026-001").set(as("DEV001"));
    expect(ownerBefore.body.request.salaryPreview).toBeUndefined();
    expect(ownerBefore.body.request.finalSalary).toBeUndefined();

    const finalized = await request(app).post("/api/requests/TR-2026-001/finalize").set(as("DEV008")).send({ note: "Final amount checked and approved." });
    expect(finalized.status).toBe(200);
    expect(finalized.body.request.stage).toBe("completed");
    expect(finalized.body.request.finalSalary.totalAmount).toBe(finalized.body.request.salaryPreview.totalAmount);

    const ownerAfter = await request(app).get("/api/requests/TR-2026-001").set(as("DEV001"));
    expect(ownerAfter.body.request.finalSalary.totalAmount).toBeGreaterThan(0);
    expect(ownerAfter.body.request.salaryPreview).toBeUndefined();

    const locked = await request(app).patch("/api/requests/TR-2026-001/review").set(as("DEV008")).send({ bonusAmount: 0, penaltyAmount: 0, note: "Too late" });
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe("REQUEST_ALREADY_COMPLETED");
  });

  it("enforces roles, stage order, rejection reason, and manager-only rejection", async () => {
    const skipped = await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV005")).send({ accommodationType: "none" });
    expect(skipped.status).toBe(403);

    const noReason = await request(app).post("/api/requests/TR-2026-001/reject").set(as("DEV004")).send({ reason: "" });
    expect(noReason.status).toBe(400);

    const wrongRejector = await request(app).post("/api/requests/TR-2026-001/reject").set(as("DEV005")).send({ reason: "Not allowed" });
    expect(wrongRejector.status).toBe(403);

    const rejected = await request(app).post("/api/requests/TR-2026-001/reject").set(as("DEV004")).send({ reason: "Mission withdrawn." });
    expect(rejected.status).toBe(200);
    expect(rejected.body.request).toMatchObject({ stage: "cancelled", cancellationReason: "Mission withdrawn." });
    expect((await request(app).post("/api/requests/TR-2026-001/approve").set(as("DEV004")).send({})).status).toBe(409);
  });

  it("exposes submitted attachments to Transportation", async () => {
    const response = await request(app).get("/api/requests?scope=queue").set(as("DEV006"));
    expect(response.status).toBe(200);
    expect(response.body.requests[0].attachments[0]).toMatchObject({ name: "train-ticket-TR-2026-003.txt" });
  });
});
