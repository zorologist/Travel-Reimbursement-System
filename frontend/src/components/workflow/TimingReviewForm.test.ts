import { describe, expect, it } from "vitest";

import { missionNightCount } from "./TimingReviewForm";

describe("missionNightCount", () => {
  it("identifies a one-day mission as zero nights", () => {
    expect(missionNightCount("2026-08-18T07:00:00.000Z", "2026-08-18T16:00:00.000Z")).toBe(0);
  });

  it("counts overnight missions by calendar date", () => {
    expect(missionNightCount("2026-08-18T07:00:00.000Z", "2026-08-20T16:00:00.000Z")).toBe(2);
  });

  it("rejects an invalid return time", () => {
    expect(missionNightCount("2026-08-18T16:00:00.000Z", "2026-08-18T07:00:00.000Z")).toBeNull();
  });
});
