import type { NextFunction, Request, Response } from "express";
import type { User } from "../../../shared/types/User.js";
import { findUserById } from "../storage/memoryStore.js";
import { UnauthenticatedError } from "./errorHandler.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const AUTH_HEADER = "authorization";
const BEARER_PREFIX = "Bearer ";

/**
 * Development-only auth: the bearer token IS the user id, returned as-is by
 * POST /api/auth/login. This must be replaced with real sessions/Active
 * Directory groups before this system handles real company data — see
 * README "Development Setup" / "Company Integration Later".
 */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header(AUTH_HEADER);
  if (header?.startsWith(BEARER_PREFIX)) {
    const userId = header.slice(BEARER_PREFIX.length).trim();
    req.user = findUserById(userId) ?? undefined;
  }
  next();
}

/** Mount after attachUser on any route that requires a signed-in user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthenticatedError());
    return;
  }
  next();
}
