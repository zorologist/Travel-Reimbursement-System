import { beforeEach, describe, expect, it } from "vitest";

import { authorizedView } from "../services/responseViews.js";
import { findRequestById, resetStoreForTests } from "../storage/memoryStore.js";

beforeEach(() => resetStoreForTests());

describe("authorized request views", () => {
  it("keeps a personal view private while allowing the same dual-role user to process a department queue item", () => {
    const source = findRequestById("TR-2026-005")!;
    const salaryOwnedRequest = { ...source, employeeId: "u8" };
    const roles = ["employee", "salary"] as const;

    expect(authorizedView(salaryOwnedRequest, "u8", roles).salaryPreview).toBeUndefined();
    expect(authorizedView(salaryOwnedRequest, "u8", roles, true).salaryPreview).toEqual(source.salaryPreview);
  });
});
