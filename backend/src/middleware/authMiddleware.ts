import type { RequestHandler } from "express";
import type { User } from "@travel-reimbursement/shared";

import { authenticationConfig } from "../auth/authConfig.js";
import { SESSION_COOKIE, sessionCookie } from "../auth/sessionCookies.js";
import { ApiError } from "../errors/ApiError.js";
import { appStore } from "../storage/appStore.js";
import { createSession, userForSession } from "../services/authService.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      sessionToken?: string;
      requestId?: string;
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
export const authMiddleware: RequestHandler = async (request, response, next) => {
  if (request.currentUser) {
    next();
    return;
  }
  const token = cookieValue(request, SESSION_COOKIE);
  const sessionUser = token ? await userForSession(token) : null;
  if (sessionUser) {
    request.currentUser = sessionUser;
    request.sessionToken = token;
    next();
    return;
  }

  const auth = authenticationConfig();
  if (auth.mode === "iis") {
    const remoteAddress = request.socket.remoteAddress ?? "";
    if (!auth.trustedProxyAddresses.has(remoteAddress)) {
      next(new ApiError(403, "UNTRUSTED_AUTH_PROXY", "Windows identity was not received from the trusted IIS proxy."));
      return;
    }
    const identity = request.header(auth.identityHeader)?.trim();
    if (!identity) {
      next(new ApiError(401, "WINDOWS_AUTHENTICATION_REQUIRED", "Windows authentication is required."));
      return;
    }
    const user = await appStore.findUserByDirectoryIdentity(identity);
    if (!user) {
      next(new ApiError(403, "DIRECTORY_USER_NOT_REGISTERED", "Your Windows account is not registered for this application."));
      return;
    }
    const session = createSession(user, false);
    response.setHeader("Set-Cookie", sessionCookie(session.token, false));
    request.currentUser = user;
    request.sessionToken = session.token;
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
  const user = await appStore.findUserByEmployeeNumber(employeeNumber);
  if (!user) {
    next(new ApiError(401, "INVALID_DEVELOPMENT_USER", "The development employee was not found."));
    return;
  }
  request.currentUser = user;
  next();
};
