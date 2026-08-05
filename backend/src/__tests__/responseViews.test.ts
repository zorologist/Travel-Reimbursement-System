import { beforeEach, describe, expect, it } from "vitest";

import { authorizedView } from "../services/responseViews.js";
import { findRequestById, resetStoreForTests } from "../storage/memoryStore.js";

beforeEach(() => resetStoreForTests());

describe("authorized request views", () => {
  it("keeps a personal view private while allowing the same dual-role user to process a department queue item", async () => {
    const source = findRequestById("TR-2026-005")!;
    const salaryOwnedRequest = { ...source, employeeId: "u8" };
    const roles = ["employee", "salary"] as const;

    expect((await authorizedView(salaryOwnedRequest, "u8", roles)).salaryPreview).toBeUndefined();
    expect((await authorizedView(salaryOwnedRequest, "u8", roles, true)).salaryPreview).toEqual(source.salaryPreview);
  });

  it("redacts Payroll notes and financial changes from PR", async () => {
    const source = findRequestById("TR-2026-006")!;
    const request = {
      ...source,
      auditEvents: source.auditEvents.map((event, index) => index === source.auditEvents.length - 1
        ? {
          ...event,
          actorRole: "salary" as const,
          note: "Bonus increased by 100.",
          changes: { bonusAmount: { before: 0, after: 100 } },
        }
        : event),
    };
    const view = await authorizedView(request, "u5", ["employee", "pr"]);
    const lastEvent = (view.auditEvents as Array<{ note: string | null; changes: object }>).at(-1)!;
    expect(lastEvent.note).toBeNull();
    expect(lastEvent.changes).toEqual({});
  });
});
