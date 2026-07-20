import { randomUUID } from "node:crypto";
import type { User } from "@travel-reimbursement/shared";

import { developmentCredentials } from "../data/developmentCredentials.js";
import { findUserByEmployeeNumber, findUserById } from "../storage/memoryStore.js";

interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number | null;
}

const sessions = new Map<string, SessionRecord>();
const REMEMBER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function authenticateCredentials(employeeNumber: string, password: string): User | null {
  const normalized = employeeNumber.trim().toUpperCase();
  const credential = developmentCredentials.find((candidate) => candidate.employeeNumber === normalized && candidate.password === password);
  if (!credential) return null;
  return findUserByEmployeeNumber(normalized) ?? null;
}

export function createSession(user: User, remember: boolean): SessionRecord {
  const session: SessionRecord = {
    token: randomUUID(),
    userId: user.id,
    expiresAt: remember ? Date.now() + REMEMBER_DURATION_MS : null,
  };
  sessions.set(session.token, session);
  return session;
}

export function userForSession(token: string): User | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt !== null && session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return findUserById(session.userId) ?? null;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function resetSessionsForTests(): void {
  sessions.clear();
}
