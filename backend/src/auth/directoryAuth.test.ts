import { describe, expect, it } from "vitest";
import { InvalidCredentialsError, UnavailableError } from "ldapts";

import {
  classifyDirectoryAuthenticationError,
  toUserPrincipalName,
} from "./directoryAuth.js";

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

describe("classifyDirectoryAuthenticationError", () => {
  it.each([
    ["52e", "invalid-credentials"],
    ["525", "invalid-credentials"],
    ["775", "account-locked"],
    ["533", "account-disabled"],
    ["701", "account-expired"],
    ["532", "password-expired"],
    ["773", "password-change-required"],
    ["52f", "account-restricted"],
    ["530", "account-restricted"],
    ["531", "account-restricted"],
  ] as const)("maps AD diagnostic data %s to %s", (subcode, expected) => {
    const error = new InvalidCredentialsError(
      `AcceptSecurityContext error, data ${subcode}, v4563`,
    );
    expect(classifyDirectoryAuthenticationError(error)).toBe(expected);
  });

  it("keeps an unclassified credential denial under the safe username/password response", () => {
    expect(classifyDirectoryAuthenticationError(new InvalidCredentialsError()))
      .toBe("invalid-credentials");
  });

  it.each([
    new UnavailableError("Directory unavailable"),
    Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }),
    Object.assign(new Error("Connection timeout"), { code: "ETIMEDOUT" }),
    Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }),
    new Error("BindRequest: Operation timed out"),
  ])("treats non-credential LDAP/network failures as unavailable", (error) => {
    expect(classifyDirectoryAuthenticationError(error)).toBe("directory-unavailable");
  });
});
