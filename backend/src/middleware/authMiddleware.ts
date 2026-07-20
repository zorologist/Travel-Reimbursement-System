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
    }
  }
}

function cookie(request: Parameters<RequestHandler>[0], name: string): string | undefined {
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
  const bearer = request.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = cookie(request, SESSION_COOKIE) ?? bearer;
  const sessionUser = token ? userForSession(token) : null;
  if (sessionUser) {
    request.currentUser = sessionUser;
    next();
    return;
  }

  const employeeNumber = process.env.NODE_ENV === "production" ? undefined : request.header("x-employee-number");
  if (!employeeNumber) {
    next(new ApiError(401, "AUTHENTICATION_REQUIRED", "A development employee identity is required."));
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
