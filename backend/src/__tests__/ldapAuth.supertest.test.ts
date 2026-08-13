import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as directoryAuth from "../auth/directoryAuth.js";
import { DirectoryAuthenticationError } from "../auth/directoryAuth.js";
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
    expect(response.body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "The Windows username or password is incorrect.",
      details: null,
    });
  });

  it("rejects a verified AD account that has no matching application user", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(true);
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "NOT_A_REAL_USER", password: "whatever-ad-accepts", remember: false });

    expect(response.status).toBe(403);
    expect(response.body.error).toEqual({
      code: "DIRECTORY_USER_NOT_REGISTERED",
      message: "Your Windows account is not registered for this application.",
      details: null,
    });
  });

  it.each([
    ["account-locked", 403, "DIRECTORY_ACCOUNT_LOCKED", "Your Windows account is locked. Contact IT support or wait for it to be unlocked."],
    ["account-disabled", 403, "DIRECTORY_ACCOUNT_DISABLED", "Your Windows account is disabled. Contact IT support."],
    ["account-expired", 403, "DIRECTORY_ACCOUNT_EXPIRED", "Your Windows account has expired. Contact IT support."],
    ["password-expired", 403, "DIRECTORY_PASSWORD_EXPIRED", "Your Windows password has expired. Change it, then try again."],
    ["password-change-required", 403, "DIRECTORY_PASSWORD_CHANGE_REQUIRED", "You must change your Windows password before signing in here."],
    ["account-restricted", 403, "DIRECTORY_ACCOUNT_RESTRICTED", "Your Windows account cannot sign in from this workstation or at this time. Contact IT support."],
    ["directory-unavailable", 503, "DIRECTORY_UNAVAILABLE", "The company sign-in service is unavailable. Try again shortly or contact IT support."],
  ] as const)("returns a distinct response for %s", async (reason, status, code, message) => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials")
      .mockRejectedValue(new DirectoryAuthenticationError(reason));
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: `state-${reason}`, password: "not-relevant", remember: false });

    expect(response.status).toBe(status);
    expect(response.body.error).toEqual({ code, message, details: null });
  });

  it("treats an unexpected directory exception as unavailable, not a bad password", async () => {
    vi.spyOn(directoryAuth, "verifyDirectoryCredentials")
      .mockRejectedValue(new Error("connect timeout"));
    const { app } = await import("../app.js");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "unexpected-outage-user", password: "not-relevant", remember: false });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("DIRECTORY_UNAVAILABLE");
  });

  it("limits failed attempts per normalized AD user rather than shared proxy IP", async () => {
    const verify = vi.spyOn(directoryAuth, "verifyDirectoryCredentials").mockResolvedValue(false);
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
    expect(blocked.body.error).toEqual({
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many incorrect login attempts. Try again in 5 minutes.",
      details: null,
    });
    expect(verify).toHaveBeenCalledTimes(5);

    const differentUser = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "another-user", password: "wrong", remember: false });
    expect(differentUser.status).toBe(401);
  });

  it("does not count directory outages as incorrect login attempts", async () => {
    const verify = vi.spyOn(directoryAuth, "verifyDirectoryCredentials")
      .mockRejectedValue(new DirectoryAuthenticationError("directory-unavailable"));
    const { app } = await import("../app.js");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const unavailable = await request(app)
        .post("/api/auth/login")
        .send({ employeeNumber: "repeated-outage-user", password: "not-relevant", remember: false });
      expect(unavailable.status).toBe(503);
    }

    verify.mockResolvedValue(false);
    const credentialFailure = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "repeated-outage-user", password: "wrong", remember: false });
    expect(credentialFailure.status).toBe(401);
  });
});
