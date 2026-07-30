import { describe, expect, it } from "vitest";

import { safeCsvCell } from "./SalaryDashboardPage";

describe("Payroll CSV export", () => {
  it("escapes quotes and neutralizes spreadsheet formulas", () => {
    expect(safeCsvCell('Normal "name"')).toBe('"Normal ""name"""');
    expect(safeCsvCell("=HYPERLINK(\"https://evil.example\")")).toBe(
      '"\'=HYPERLINK(""https://evil.example"")"',
    );
    expect(safeCsvCell("  @SUM(A1:A2)")).toBe('"\'  @SUM(A1:A2)"');
  });
});
