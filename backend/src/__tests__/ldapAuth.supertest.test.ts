import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as directoryAuth from "../auth/directoryAuth.js";
import { resetSessionsForTests } from "../services/authService.js";

const originalAuthMode = process.env.AUTH_MODE;

beforeEach(() => {
  process.env.AUTH_MODE = "ldap";
  resetSessionsForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  if (originalAuthMode === undefined) delete process.env.AUTH_MODE;
  else process.env.AUTH_MODE = originalAuthMode;
});

describe("LDAP-backed password login", () => {
  it("signs in a registered user once Active Directory verifies the password", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(true);
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "DEV001", password: "whatever-ad-accepts", remember: false });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ employeeNumber: "DEV001" });
    expect(response.headers["set-cookie"]?.[0]).toContain("travel_reimbursement_session=");
  });

  it("rejects credentials Active Directory does not accept", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(false);
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "DEV001", password: "wrong", remember: false });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects a verified AD account that has no matching application user", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(true);
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "NOT_A_REAL_USER", password: "whatever-ad-accepts", remember: false });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("DIRECTORY_USER_NOT_REGISTERED");
  });

  it("limits failed attempts per normalized AD user rather than shared proxy IP", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(false);
    const { app } = await import("../app.js");
    const sameAccount = [
      "rate-user",
      "RATE-USER",
      "EGAS\\rate-user",
      "EGAS/rate-user",
      "rate-user@EGAS.Local",
    ];

    for (const username of sameAccount) {
      const failed = await request(app)
        .post("/api/auth/login")
        .send({ employeeNumber: username, password: "wrong", remember: false });
      expect(failed.status).toBe(401);
    }

    const blocked = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "rate-user", password: "wrong", remember: false });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("TOO_MANY_ATTEMPTS");

    const differentUser = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "another-user", password: "wrong", remember: false });
    expect(differentUser.status).toBe(401);
  });
});
