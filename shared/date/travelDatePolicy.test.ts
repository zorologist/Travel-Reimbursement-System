import { describe, expect, it } from "vitest";

import {
  earliestTravelDate,
  earliestTravelDateInputValue,
  isWithinTravelSubmissionWindow,
} from "./travelDatePolicy.js";

describe("travel submission date policy", () => {
  it("allows the same calendar day from the previous month", () => {
    const now = new Date(2026, 7, 3, 14, 30);
    expect(earliestTravelDateInputValue(now)).toBe("2026-07-03");
    expect(isWithinTravelSubmissionWindow(new Date(2026, 6, 3, 0, 0), now)).toBe(true);
    expect(isWithinTravelSubmissionWindow(new Date(2026, 6, 2, 23, 59), now)).toBe(false);
  });

  it("clamps month-end dates to the last valid day of the previous month", () => {
    const boundary = earliestTravelDate(new Date(2026, 2, 31, 9, 0));
    expect(boundary.getFullYear()).toBe(2026);
    expect(boundary.getMonth()).toBe(1);
    expect(boundary.getDate()).toBe(28);
  });

  it("rejects invalid dates", () => {
    expect(isWithinTravelSubmissionWindow("not-a-date", new Date(2026, 7, 3))).toBe(false);
  });
});
