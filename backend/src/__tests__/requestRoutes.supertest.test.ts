import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { resetStoreForTests } from "../storage/memoryStore.js";

const validRequest = {
  destinationCity: "Suez",
  departureAt: "2027-04-01T08:00:00.000Z",
  returnAt: "2027-04-03T18:00:00.000Z",
  tripType: "round-trip" as const,
  managerId: "u4",
  accommodationType: "none",
  transportationMethod: "Company bus",
  notes: "Operational site visit.",
  attachments: [{ id: "ticket-1", name: "ticket.jpg", mimeType: "image/jpeg", size: 4, url: "data:image/jpeg;base64,AA==" }],
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
    expect(response.body.request.id).toBe("TR-2026-0008");
    expect(response.body.request.salaryPreview).toBeUndefined();
  });

  it("rejects an employee-supplied job level", async () => {
    const response = await request(app)
      .post("/api/requests")
      .set(as("DEV001"))
      .send({ ...validRequest, jobLevel: "Chairman" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("validates required fields and travel date order", async () => {
    const missing = await request(app).post("/api/requests").set(as("DEV001")).send({ destinationCity: "Suez" });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe("VALIDATION_ERROR");

    const reversed = await request(app).post("/api/requests").set(as("DEV001")).send({ ...validRequest, returnAt: "2027-03-01T08:00:00.000Z" });
    expect(reversed.status).toBe(400);
    expect(reversed.body.error.code).toBe("VALIDATION_ERROR");

    const noPurpose = await request(app)
      .post("/api/requests")
      .set(as("DEV001"))
      .send({ ...validRequest, notes: "   " });
    expect(noPurpose.status).toBe(400);

    const zeroDurationRoundTrip = await request(app)
      .post("/api/requests")
      .set(as("DEV001"))
      .send({ ...validRequest, returnAt: validRequest.departureAt });
    expect(zeroDurationRoundTrip.status).toBe(400);
  });

  it("accepts one-way requests without a return leg and requires ticket images", async () => {
    const departureAt = "2027-04-01T08:00:00.000Z";
    const oneWay = await request(app).post("/api/requests").set(as("DEV001")).send({
      ...validRequest,
      tripType: "one-way",
      departureAt,
      returnAt: departureAt,
    });
    expect(oneWay.status).toBe(201);
    expect(oneWay.body.request).toMatchObject({ tripType: "one-way", departureAt, returnAt: departureAt });

    const missingTicket = await request(app).post("/api/requests").set(as("DEV001")).send({
      ...validRequest,
      transportationMethod: "Employee's Private Car",
      attachments: [],
    });
    expect(missingTicket.status).toBe(400);
    expect(missingTicket.body.error.code).toBe("VALIDATION_ERROR");

    const pdfTicket = await request(app).post("/api/requests").set(as("DEV001")).send({
      ...validRequest,
      attachments: [{ id: "ticket-pdf", name: "ticket.pdf", mimeType: "application/pdf", size: 4, url: "data:application/pdf;base64,AA==" }],
    });
    expect(pdfTicket.status).toBe(400);

    const mismatchedDataUrl = await request(app).post("/api/requests").set(as("DEV001")).send({
      ...validRequest,
      attachments: [{
        id: "fake-image",
        name: "ticket.jpg",
        mimeType: "image/jpeg",
        size: 4,
        url: "data:text/html;base64,PGgxPk5vdCBhbiBpbWFnZTwvaDE+",
      }],
    });
    expect(mismatchedDataUrl.status).toBe(400);
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

  it("allows only the manager selected by the employee to see the request", async () => {
    const created = await request(app).post("/api/requests").set(as("DEV001")).send({ ...validRequest, managerId: "u10" });
    const id = created.body.request.id as string;

    expect((await request(app).get(`/api/requests/${id}`).set(as("DEV004"))).status).toBe(403);
    expect((await request(app).post(`/api/requests/${id}/approve`).set(as("DEV004")).send({ reason: "Wrong manager" })).status).toBe(403);

    const selectedManager = await request(app).get(`/api/requests/${id}`).set(as("DEV010"));
    expect(selectedManager.status).toBe(200);
    expect(selectedManager.body.request.submittedRequest.managerId).toBe("u10");
  });

  it("prevents department reviewers from opening requests outside their current stage", async () => {
    expect(
      (await request(app).get("/api/requests/TR-2026-001").set(as("DEV005"))).status,
    ).toBe(403);
    expect(
      (await request(app).get("/api/requests/TR-2026-002").set(as("DEV005"))).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/requests/TR-2026-002").set(as("DEV006"))).status,
    ).toBe(403);
  });

  it("prevents a pure employee from opening a department queue", async () => {
    const response = await request(app).get("/api/requests?scope=queue").set(as("DEV001"));
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("lets Payroll track every request with original and current details", async () => {
    const response = await request(app).get("/api/requests?scope=payroll-track").set(as("DEV008"));
    expect(response.status).toBe(200);
    expect(response.body.requests).toHaveLength(7);
    expect(response.body.requests[0]).toHaveProperty("submittedRequest");
    expect(response.body.requests[0]).toHaveProperty("salaryPreview");
    expect(response.body.requests[0]).toHaveProperty("auditEvents");

    expect((await request(app).get("/api/requests?scope=payroll-track").set(as("DEV005"))).status).toBe(403);
  });

  it("redacts all monetary data from the PR queue", async () => {
    const response = await request(app).get("/api/requests?scope=queue").set(as("DEV005"));
    expect(response.status).toBe(200);
    expect(response.body.requests[0].salaryPreview).toBeUndefined();
    expect(response.body.requests[0].priceRevisions).toBeUndefined();
    expect(response.body.requests[0].transportationCost).toBeUndefined();
    expect(response.body.requests[0].claimedTransportationCost).toBeUndefined();
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
    expect(response.body.request.auditEvents).toEqual([]);
  });
});
