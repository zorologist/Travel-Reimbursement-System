import { randomUUID, timingSafeEqual } from "node:crypto";
import type { User } from "@travel-reimbursement/shared";
import bcrypt from "bcrypt";

import { authenticationConfig } from "../auth/authConfig.js";
import { verifyDirectoryCredentials } from "../auth/directoryAuth.js";
import { developmentCredentials } from "../data/developmentCredentials.js";
import { ApiError } from "../errors/ApiError.js";
import { appStore } from "../storage/appStore.js";

interface SessionRecord {
  token: string;
  userId: string;
  csrfToken: string;
  expiresAt: number;
  lastAccessAt: number;
  createdAt: number;
}

const sessions = new Map<string, SessionRecord>();
const failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
const SHORT_SESSION_MS = 4 * 60 * 60 * 1000;
const REMEMBER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILURE_ENTRIES = 10_000;
const MAX_SESSIONS_PER_USER = 10;
const DUMMY_PASSWORD_HASH = "$2b$12$Av9D3bDwbuAjfXsa4B81Muot5MtJcvXLt1A5sXBA2pz9/pYJQ43Gq";

const USERNAME_ALIASES: Record<string, string> = {
  admin: "DEV004",
  manager: "DEV004",
  pr: "DEV005",
  transport: "DEV006",
  transportation: "DEV006",
  timing: "DEV007",
  payroll: "DEV008",
  salary: "DEV008",
  employee: "DEV001",
  user: "DEV001",
};

function resolveEmployeeNumber(input: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (char) => String(arabicNumerals.indexOf(char)));

  if (USERNAME_ALIASES[normalized]) {
    return USERNAME_ALIASES[normalized];
  }
  return normalized.toUpperCase();
}

function developmentAccountsEnabled(): boolean {
  const configured = process.env.ENABLE_DEVELOPMENT_ACCOUNTS;
  if (configured !== undefined) return configured === "true";
  return process.env.NODE_ENV !== "production";
}

function activeFailureEntry(key: string, now = Date.now()) {
  const entry = failedAttempts.get(key);
  if (entry?.lockedUntil && entry.lockedUntil <= now) {
    failedAttempts.delete(key);
    return undefined;
  }
  return entry;
}

function registerFailure(key: string): void {
  if (!failedAttempts.has(key) && failedAttempts.size >= MAX_FAILURE_ENTRIES) {
    const oldestKey = failedAttempts.keys().next().value;
    if (oldestKey) failedAttempts.delete(oldestKey);
  }
  const entry = activeFailureEntry(key) ?? { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCKOUT_MS;
  failedAttempts.set(key, entry);
}

export async function authenticateCredentials(identifier: string, password: string): Promise<User | null> {
  if (authenticationConfig().mode === "ldap") {
    return authenticateAgainstDirectory(identifier, password);
  }

  const normalized = resolveEmployeeNumber(identifier);
  if (!developmentAccountsEnabled()) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }
  const failure = activeFailureEntry(normalized);
  const credential = developmentCredentials.find((candidate) => candidate.employeeNumber === normalized);
  const passwordMatches = await bcrypt.compare(password, credential?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (failure?.lockedUntil || !credential || !passwordMatches) {
    if (!failure?.lockedUntil) registerFailure(normalized);
    return null;
  }
  failedAttempts.delete(normalized);
  return await appStore.findUserByEmployeeNumber(normalized) ?? null;
}

async function authenticateAgainstDirectory(username: string, password: string): Promise<User | null> {
  const key = username.trim().toLowerCase();
  const failure = activeFailureEntry(key);
  if (failure?.lockedUntil) return null;

  const verified = await verifyDirectoryCredentials(username, password);
  if (!verified) {
    registerFailure(key);
    return null;
  }
  failedAttempts.delete(key);
  const user = await appStore.findUserByDirectoryIdentity(username.trim());
  if (!user) {
    throw new ApiError(403, "DIRECTORY_USER_NOT_REGISTERED", "Your Windows account is not registered for this application.");
  }
  return user;
}

export function createSession(user: User, remember: boolean): SessionRecord {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now || session.lastAccessAt + IDLE_TIMEOUT_MS <= now) {
      sessions.delete(token);
    }
  }
  const userSessions = [...sessions.entries()]
    .filter(([, session]) => session.userId === user.id)
    .sort(([, left], [, right]) => left.createdAt - right.createdAt);
  while (userSessions.length >= MAX_SESSIONS_PER_USER) {
    const oldest = userSessions.shift();
    if (oldest) sessions.delete(oldest[0]);
  }
  const session: SessionRecord = {
    token: randomUUID(),
    userId: user.id,
    csrfToken: randomUUID(),
    expiresAt: now + (remember ? REMEMBER_DURATION_MS : SHORT_SESSION_MS),
    lastAccessAt: now,
    createdAt: now,
  };
  sessions.set(session.token, session);
  return session;
}

export async function userForSession(token: string): Promise<User | null> {
  const session = sessions.get(token);
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt <= now || session.lastAccessAt + IDLE_TIMEOUT_MS <= now) {
    sessions.delete(token);
    return null;
  }
  session.lastAccessAt = now;
  return await appStore.findUserById(session.userId) ?? null;
}

export function csrfTokenForSession(token: string): string | null {
  return sessions.get(token)?.csrfToken ?? null;
}

export function isValidCsrfToken(token: string, csrfToken: string): boolean {
  const session = sessions.get(token);
  if (!session || csrfToken.length !== session.csrfToken.length) return false;
  return timingSafeEqual(Buffer.from(csrfToken), Buffer.from(session.csrfToken));
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function deleteOtherSessions(userId: string, currentToken: string): void {
  for (const [token, session] of sessions) {
    if (session.userId === userId && token !== currentToken) sessions.delete(token);
  }
}

export function resetSessionsForTests(): void {
  sessions.clear();
  failedAttempts.clear();
}
