import { beforeEach, describe, expect, it } from "vitest";

import {
  TravelRequestSchema,
  UserSchema,
  type AuditEvent,
  type TravelRequest,
} from "@travel-reimbursement/shared";
import {
  addAuditEvent,
  createRequest,
  findRequestById,
  findUserByEmployeeNumber,
  listRequests,
  listRequestsByOwner,
  listRequestsByStage,
  listRequestsForRole,
  listUsers,
  resetStoreForTests,
  updateRequest,
} from "./memoryStore.js";

describe("development memory store", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("contains schema-valid users with unique IDs and employee numbers", () => {
    const users = listUsers();
    expect(users.length).toBe(9);
    expect(new Set(users.map((user) => user.id)).size).toBe(users.length);
    expect(new Set(users.map((user) => user.employeeNumber)).size).toBe(users.length);
    users.forEach((user) => expect(UserSchema.safeParse(user).success).toBe(true));
  });

  it("contains a valid request example for every workflow outcome", () => {
    const requests = listRequests();
    const stages = new Set(requests.map((request) => request.stage));

    expect(stages).toEqual(new Set([
      "manager-review",
      "pr-review",
      "transportation-review",
      "timing-review",
      "salary-finalization",
      "completed",
      "cancelled",
    ]));
    requests.forEach((request) => {
      expect(TravelRequestSchema.safeParse(request).success).toBe(true);
      expect(request.auditEvents.length).toBeGreaterThan(0);
    });
  });

  it("provides internally consistent terminal examples", () => {
    const completed = findRequestById("TR-2026-006");
    const cancelled = findRequestById("TR-2026-007");

    expect(completed?.finalSalary).toEqual(completed?.salaryPreview);
    expect(completed?.auditEvents.at(-1)?.action).toBe("finalize");
    expect(cancelled?.cancellationReason).toBeTruthy();
    expect(cancelled?.auditEvents.at(-1)?.action).toBe("reject");
  });

  it("provides stable salary totals for frontend assertions", () => {
    const expectedTotals = new Map([
      ["TR-2026-001", 480],
      ["TR-2026-002", 232.5],
      ["TR-2026-003", 280],
      ["TR-2026-004", 100],
      ["TR-2026-005", 448],
      ["TR-2026-006", 378],
      ["TR-2026-007", 140],
    ]);

    for (const [requestId, total] of expectedTotals) {
      expect(findRequestById(requestId)?.salaryPreview.totalAmount).toBe(total);
    }
  });

  it("finds employee numbers case-insensitively", () => {
    expect(findUserByEmployeeNumber(" dev008 ")?.id).toBe("u8");
  });

  it("filters owner, stage, and department queues without exposing storage arrays", () => {
    expect(listRequestsByOwner("u1").map((request) => request.id)).toEqual([
      "TR-2026-001",
      "TR-2026-004",
      "TR-2026-007",
    ]);
    expect(listRequestsByStage("pr-review").map((request) => request.id)).toEqual(["TR-2026-002"]);
    expect(listRequestsForRole("transportation").map((request) => request.id)).toEqual(["TR-2026-003"]);
    expect(listRequestsForRole("employee")).toEqual([]);
  });

  it("locks completed and cancelled records", () => {
    expect(() => updateRequest("TR-2026-006", { destinationCity: "Changed" })).toThrow(/locked/);
    expect(() => updateRequest("TR-2026-007", { destinationCity: "Changed" })).toThrow(/locked/);
  });

  it("returns copies that cannot mutate stored records", () => {
    const listed = listRequests();
    listed[0].destinationCity = "Mutated city";
    listed[0].auditEvents.length = 0;

    const stored = findRequestById("TR-2026-001");
    expect(stored?.destinationCity).toBe("Alexandria");
    expect(stored?.auditEvents).toHaveLength(1);
  });

  it("creates an isolated request and rejects duplicate IDs", () => {
    const source = findRequestById("TR-2026-001") as TravelRequest;
    const request = structuredClone(source);
    request.id = "TR-TEST-NEW";
    request.auditEvents = request.auditEvents.map((event) => ({
      ...event,
      id: `TR-TEST-NEW-${event.id}`,
      requestId: "TR-TEST-NEW",
    }));

    const created = createRequest(request);
    created.destinationCity = "Changed outside storage";

    expect(findRequestById("TR-TEST-NEW")?.destinationCity).toBe("Alexandria");
    expect(() => createRequest(request)).toThrow(/already exists/);
  });

  it("preserves identity fields during partial updates", () => {
    const updated = updateRequest("TR-2026-001", {
      id: "forbidden-id",
      employeeId: "forbidden-owner",
      createdAt: "2000-01-01T00:00:00.000Z",
      destinationCity: "Damietta",
      updatedAt: "2026-07-21T08:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: "TR-2026-001",
      employeeId: "u1",
      createdAt: "2026-07-20T08:00:00.000Z",
      destinationCity: "Damietta",
      updatedAt: "2026-07-21T08:00:00.000Z",
    });
  });

  it("allows audit events to be appended but not rewritten", () => {
    const request = findRequestById("TR-2026-001") as TravelRequest;
    const event: AuditEvent = {
      id: "TR-2026-001-event-test",
      requestId: request.id,
      actorId: "u1",
      actorRole: "employee",
      action: "edit",
      fromStage: "manager-review",
      toStage: "manager-review",
      changes: { destinationCity: { before: "Alexandria", after: "Damietta" } },
      note: "Storage test event.",
      createdAt: "2026-07-21T08:00:00.000Z",
    };

    expect(addAuditEvent(request.id, event)?.auditEvents).toHaveLength(2);
    expect(() => updateRequest(request.id, { auditEvents: [] })).toThrow(/append-only/);
  });

  it("restores fresh deterministic data", () => {
    updateRequest("TR-2026-001", { destinationCity: "Temporary mutation" });
    resetStoreForTests();

    expect(findRequestById("TR-2026-001")?.destinationCity).toBe("Alexandria");
    expect(listRequests()).toHaveLength(7);
  });
});
