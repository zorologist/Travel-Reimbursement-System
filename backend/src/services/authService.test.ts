import { beforeEach, describe, expect, it, vi } from "vitest";

import { findUserByEmployeeNumber } from "../storage/memoryStore.js";
import {
  authenticateCredentials,
  createSession,
  resetSessionsForTests,
  userForSession,
} from "./authService.js";

beforeEach(() => {
  resetSessionsForTests();
  vi.useRealTimers();
});

describe("authentication security controls", () => {
  it("accepts the documented bcrypt-backed development password and rejects generic passwords", async () => {
    await expect(
      authenticateCredentials("DEV001", "Employee@123"),
    ).resolves.toMatchObject({ employeeNumber: "DEV001" });
    await expect(authenticateCredentials("DEV001", "employee")).resolves.toBeNull();
    await expect(authenticateCredentials("DEV001", "123456")).resolves.toBeNull();
  });

  it("locks an account after five failed attempts", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await authenticateCredentials("DEV004", "incorrect password")).toBeNull();
    }
    expect(
      await authenticateCredentials("DEV004", "Admin@123"),
    ).toBeNull();
  }, 15_000);

  it("can disable all development accounts for the published deployment", async () => {
    const previous = process.env.ENABLE_DEVELOPMENT_ACCOUNTS;
    process.env.ENABLE_DEVELOPMENT_ACCOUNTS = "false";
    try {
      await expect(authenticateCredentials("DEV001", "Employee@123")).resolves.toBeNull();
    } finally {
      process.env.ENABLE_DEVELOPMENT_ACCOUNTS = previous;
    }
  });

  it("expires short sessions after four hours even without remember-me", async () => {
    vi.useFakeTimers();
    const user = findUserByEmployeeNumber("DEV001")!;
    const session = createSession(user, false);

    vi.advanceTimersByTime(4 * 60 * 60 * 1000 + 1);

    expect(await userForSession(session.token)).toBeNull();
  });

  it("expires inactive sessions after thirty minutes", async () => {
    vi.useFakeTimers();
    const user = findUserByEmployeeNumber("DEV001")!;
    const session = createSession(user, true);

    vi.advanceTimersByTime(30 * 60 * 1000 + 1);

    expect(await userForSession(session.token)).toBeNull();
  });

  it("limits each user to ten active sessions", async () => {
    const user = findUserByEmployeeNumber("DEV001")!;
    const sessions = Array.from({ length: 11 }, () => createSession(user, true));

    expect(await userForSession(sessions[0].token)).toBeNull();
    expect(await userForSession(sessions.at(-1)!.token)).toMatchObject({ id: user.id });
  });
});
