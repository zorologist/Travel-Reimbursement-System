import { describe, expect, it } from "vitest";

import { validateRuntime } from "./runtimeValidation.js";

const validProduction = {
  NODE_ENV: "production",
  DATABASE_HOST: "localhost",
  DATABASE_NAME: "travel_reimbursement",
  DATABASE_USER: "travel_app",
  DATABASE_PASSWORD: "secret",
  STORAGE_MODE: "postgres",
  AUTH_MODE: "iis",
  ENABLE_DEVELOPMENT_ACCOUNTS: "false",
  ALLOW_DEV_AUTH_HEADER: "false",
  SERVE_FRONTEND: "true",
  HOST: "127.0.0.1",
};

describe("production runtime validation", () => {
  it("accepts the locked-down production shape", () => {
    expect(() => validateRuntime(validProduction)).not.toThrow();
  });

  it("rejects development authentication and public Node binding", () => {
    expect(() => validateRuntime({
      ...validProduction,
      AUTH_MODE: "development",
      ENABLE_DEVELOPMENT_ACCOUNTS: "true",
      HOST: "0.0.0.0",
    })).toThrow(/AUTH_MODE must be iis.*development accounts.*loopback/);
  });
});
