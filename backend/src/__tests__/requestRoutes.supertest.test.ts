import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { resetStoreForTests } from "../storage/memoryStore.js";

const validRequest = {
  destinationCity: "Suez",
  departureAt: "2027-04-01T08:00:00.000Z",
  returnAt: "2027-04-03T18:00:00.000Z",
  accommodationType: "none",
  transportationMethod: "Company bus",
};

function as(employeeNumber: string) {
  return { "x-employee-number": employeeNumber };
}

beforeEach(() => resetStoreForTests());

describe("request lifecycle HTTP API", () => {
  it("requires a trusted development identity", async () => {
    const response = await request(app).get("/api/requests");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("creates a request without accepting browser-controlled fields", async () => {
    const response = await request(app)
      .post("/api/requests")
      .set(as("DEV001"))
      .send({ ...validRequest, id: "hacked", employeeId: "u9", stage: "completed", salaryPreview: { totalAmount: 999_999 } });
    expect(response.status).toBe(201);
    expect(response.body.request).toMatchObject({ employeeId: "u1", stage: "manager-review", destinationCity: "Suez" });
    expect(response.body.request.id).not.toBe("hacked");
    expect(response.body.request.salaryPreview).toBeUndefined();
  });

  it("validates required fields and travel date order", async () => {
    const missing = await request(app).post("/api/requests").set(as("DEV001")).send({ destinationCity: "Suez" });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe("VALIDATION_ERROR");

    const reversed = await request(app).post("/api/requests").set(as("DEV001")).send({ ...validRequest, returnAt: "2027-03-01T08:00:00.000Z" });
    expect(reversed.status).toBe(400);
    expect(reversed.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns only the signed-in employee's personal requests", async () => {
    const response = await request(app).get("/api/requests?scope=mine").set(as("DEV001"));
    expect(response.status).toBe(200);
    expect(response.body.requests).toHaveLength(3);
    expect(response.body.requests.every((item: { employeeId: string }) => item.employeeId === "u1")).toBe(true);
    expect(response.body.requests.every((item: Record<string, unknown>) => item.salaryPreview === undefined)).toBe(true);
  });

  it("returns the request matching a reviewer's department queue", async () => {
    const response = await request(app).get("/api/requests?scope=queue").set(as("DEV004"));
    expect(response.status).toBe(200);
    expect(response.body.requests.map((item: { id: string }) => item.id)).toEqual(["TR-2026-001"]);
    expect(response.body.requests[0].salaryPreview).toBeDefined();
  });

  it("prevents a pure employee from opening a department queue", async () => {
    const response = await request(app).get("/api/requests?scope=queue").set(as("DEV001"));
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("prioritizes owner privacy while allowing administrative review", async () => {
    const owner = await request(app).get("/api/requests/TR-2026-001").set(as("DEV001"));
    expect(owner.status).toBe(200);
    expect(owner.body.request.salaryPreview).toBeUndefined();
    expect(owner.body.request.transportationCost).toBeUndefined();

    const manager = await request(app).get("/api/requests/TR-2026-001").set(as("DEV004"));
    expect(manager.status).toBe(200);
    expect(manager.body.request.salaryPreview).toBeDefined();

    const completedOwner = await request(app).get("/api/requests/TR-2026-006").set(as("DEV003"));
    expect(completedOwner.body.request.finalSalary.totalAmount).toBe(378);
    expect(completedOwner.body.request.salaryPreview).toBeUndefined();
  });

  it("allows only the owner to correct a recent manager-review request", async () => {
    const created = await request(app).post("/api/requests").set(as("DEV001")).send(validRequest);
    const requestId = created.body.request.id as string;
    const corrected = await request(app)
      .patch(`/api/requests/${requestId}`)
      .set(as("DEV001"))
      .send({ destinationCity: "Alexandria", stage: "completed", employeeId: "u9" });
    expect(corrected.status).toBe(200);
    expect(corrected.body.request).toMatchObject({ destinationCity: "Alexandria", stage: "manager-review", employeeId: "u1" });

    const otherEmployee = await request(app).patch(`/api/requests/${requestId}`).set(as("DEV002")).send({ destinationCity: "Cairo" });
    expect(otherEmployee.status).toBe(403);
  });

  it("does not expose financial audit changes to an owner", async () => {
    const response = await request(app).get("/api/requests/TR-2026-006").set(as("DEV003"));
    expect(response.body.request.auditEvents.every((event: { changes: unknown }) => JSON.stringify(event.changes) === "{}")).toBe(true);
  });
});
