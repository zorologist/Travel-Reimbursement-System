import type { RequestHandler } from "express";

import { authenticationConfig } from "../auth/authConfig.js";
import { SESSION_COOKIE } from "../auth/sessionCookies.js";
import { ApiError } from "../errors/ApiError.js";
import { isValidCsrfToken } from "../services/authService.js";
import { cookieValue } from "./authMiddleware.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Protects cookie-authenticated state changes with a token bound to the
 * server-side session. Requests without a session cookie continue to the
 * authentication middleware so they retain the normal 401 response.
 */
export const csrfProtection: RequestHandler = async (request, _response, next) => {
  if (SAFE_METHODS.has(request.method) || request.path === "/auth/login") {
    next();
    return;
  }

  const sessionToken = cookieValue(request, SESSION_COOKIE);
  if (!sessionToken) {
    if (authenticationConfig().mode === "iis") {
      next(new ApiError(403, "CSRF_SESSION_REQUIRED", "Open the application before submitting changes."));
      return;
    }
    next();
    return;
  }

  const csrfToken = request.header("x-csrf-token");
  if (!csrfToken || !isValidCsrfToken(sessionToken, csrfToken)) {
    next(new ApiError(403, "INVALID_CSRF_TOKEN", "The security token is missing or invalid."));
    return;
  }
  next();
};
