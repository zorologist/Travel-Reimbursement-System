import { describe, expect, it } from "vitest";

import { databaseConfig, requireDatabaseConfig } from "./config.js";

describe("database configuration", () => {
  it("keeps PostgreSQL optional for the isolated test environment", () => {
    expect(databaseConfig({})).toBeNull();
  });

  it("parses the configured connection and SSL mode", () => {
    expect(databaseConfig({
      DATABASE_URL: "postgresql://travel_app:secret@localhost:5433/travel_reimbursement",
      DATABASE_SSL: "false",
    })).toEqual({
      connectionString: "postgresql://travel_app:secret@localhost:5433/travel_reimbursement",
      ssl: false,
    });
  });

  it("supports separate fields so passwords do not require URL encoding", () => {
    expect(databaseConfig({
      DATABASE_HOST: "localhost",
      DATABASE_PORT: "5433",
      DATABASE_NAME: "travel_reimbursement",
      DATABASE_USER: "travel_app",
      DATABASE_PASSWORD: "symbols:@/stay-valid",
      DATABASE_SSL: "false",
    })).toEqual({
      host: "localhost",
      port: 5433,
      database: "travel_reimbursement",
      user: "travel_app",
      password: "symbols:@/stay-valid",
      ssl: false,
    });
  });

  it("rejects invalid protocols and SSL values", () => {
    expect(() => databaseConfig({ DATABASE_URL: "http://localhost/database" })).toThrow(/postgres/i);
    expect(() => databaseConfig({
      DATABASE_URL: "postgresql://localhost/database",
      DATABASE_SSL: "maybe",
    })).toThrow(/DATABASE_SSL/);
    expect(() => databaseConfig({ DATABASE_HOST: "localhost" })).toThrow(/must all be provided/);
    expect(() => databaseConfig({
      DATABASE_HOST: "localhost",
      DATABASE_NAME: "travel_reimbursement",
      DATABASE_USER: "travel_app",
      DATABASE_PASSWORD: "secret",
      DATABASE_PORT: "nope",
    })).toThrow(/DATABASE_PORT/);
  });

  it("requires a connection for migration commands", () => {
    expect(() => requireDatabaseConfig({})).toThrow(/DATABASE_URL/);
  });
});
