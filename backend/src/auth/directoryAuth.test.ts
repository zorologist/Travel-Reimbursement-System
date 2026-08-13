import { describe, expect, it } from "vitest";

import { toUserPrincipalName } from "./directoryAuth.js";

describe("toUserPrincipalName", () => {
  it("builds a UPN from a plain username", () => {
    expect(toUserPrincipalName("soc", "EGAS.Local")).toBe("soc@EGAS.Local");
  });

  it("strips a down-level domain prefix (backslash) before building the UPN", () => {
    expect(toUserPrincipalName("EGAS\\soc", "EGAS.Local")).toBe("soc@EGAS.Local");
  });

  it("strips a down-level domain prefix (forward slash) before building the UPN", () => {
    expect(toUserPrincipalName("EGAS/soc", "EGAS.Local")).toBe("soc@EGAS.Local");
  });

  it("leaves an already-complete UPN untouched", () => {
    expect(toUserPrincipalName("soc@EGAS.Local", "EGAS.Local")).toBe("soc@EGAS.Local");
  });

  it("trims surrounding whitespace", () => {
    expect(toUserPrincipalName("  soc  ", "EGAS.Local")).toBe("soc@EGAS.Local");
  });
});
