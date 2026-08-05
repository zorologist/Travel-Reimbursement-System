import { describe, expect, it } from "vitest";

import { authenticationConfig } from "./authConfig.js";

describe("authentication configuration", () => {
  it("defaults to development outside production and IIS in production", () => {
    expect(authenticationConfig({ NODE_ENV: "test" }).mode).toBe("development");
    expect(authenticationConfig({ NODE_ENV: "production" }).mode).toBe("iis");
  });

  it("validates modes and identity header names", () => {
    expect(() => authenticationConfig({ AUTH_MODE: "carrier-pigeon" })).toThrow(/development, iis, or ldap/);
    expect(() => authenticationConfig({ IIS_IDENTITY_HEADER: "bad header" })).toThrow(/valid HTTP header/);
  });

  it("supports an explicit trusted IIS proxy list", () => {
    const config = authenticationConfig({
      AUTH_MODE: "iis",
      IIS_TRUSTED_PROXY_ADDRESSES: "127.0.0.1, 10.0.0.8",
    });
    expect(config.trustedProxyAddresses).toEqual(new Set(["127.0.0.1", "10.0.0.8"]));
  });
});
