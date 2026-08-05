import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { resetSessionsForTests } from "../services/authService.js";

const originalAuthMode = process.env.AUTH_MODE;

beforeEach(() => {
  process.env.AUTH_MODE = "iis";
  resetSessionsForTests();
});

afterEach(() => {
  if (originalAuthMode === undefined) delete process.env.AUTH_MODE;
  else process.env.AUTH_MODE = originalAuthMode;
});

describe("IIS/Kerberos authentication boundary", () => {
  it("creates an application session from a trusted Windows identity", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("x-iis-windows-user", "EGAS\\DEV001");

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ employeeNumber: "DEV001" });
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]?.[0]).toContain("travel_reimbursement_session=");
  });

  it("rejects missing and unregistered Windows identities", async () => {
    const missing = await request(app).get("/api/auth/me");
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe("WINDOWS_AUTHENTICATION_REQUIRED");

    const unknown = await request(app)
      .get("/api/auth/me")
      .set("x-iis-windows-user", "EGAS\\NOT_REGISTERED");
    expect(unknown.status).toBe(403);
    expect(unknown.body.error.code).toBe("DIRECTORY_USER_NOT_REGISTERED");
  });

  it("disables application password login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ employeeNumber: "DEV001", password: "Employee@123", remember: false });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PASSWORD_LOGIN_DISABLED");
  });
});
