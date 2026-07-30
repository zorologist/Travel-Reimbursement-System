import type { RequestHandler } from "express";
import type { User } from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";
import { findUserByEmployeeNumber } from "../storage/memoryStore.js";
import { userForSession } from "../services/authService.js";

export const SESSION_COOKIE = "travel_reimbursement_session";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      sessionToken?: string;
    }
  }
}

export function cookieValue(request: Parameters<RequestHandler>[0], name: string): string | undefined {
  const header = request.header("cookie");
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return undefined;
}

/** Resolves the actor only from a server-issued session (or the explicit non-production test header). */
export const authMiddleware: RequestHandler = (request, _response, next) => {
  if (request.currentUser) {
    next();
    return;
  }
  const token = cookieValue(request, SESSION_COOKIE);
  const sessionUser = token ? userForSession(token) : null;
  if (sessionUser) {
    request.currentUser = sessionUser;
    request.sessionToken = token;
    next();
    return;
  }

  const devHeaderEnabled =
    process.env.ALLOW_DEV_AUTH_HEADER === "true"
    && process.env.NODE_ENV !== "production";
  const employeeNumber = devHeaderEnabled ? request.header("x-employee-number") : undefined;
  if (!employeeNumber) {
    next(new ApiError(401, "AUTHENTICATION_REQUIRED", "A valid session is required."));
    return;
  }
  const user = findUserByEmployeeNumber(employeeNumber);
  if (!user) {
    next(new ApiError(401, "INVALID_DEVELOPMENT_USER", "The development employee was not found."));
    return;
  }
  request.currentUser = user;
  next();
};
