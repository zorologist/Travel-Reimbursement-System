import type { RequestHandler } from "express";

import { ApiError } from "../errors/ApiError.js";
import { isValidCsrfToken } from "../services/authService.js";
import { cookieValue, SESSION_COOKIE } from "./authMiddleware.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Protects cookie-authenticated state changes with a token bound to the
 * server-side session. Requests without a session cookie continue to the
 * authentication middleware so they retain the normal 401 response.
 */
export const csrfProtection: RequestHandler = (request, _response, next) => {
  if (SAFE_METHODS.has(request.method) || request.path === "/auth/login") {
    next();
    return;
  }

  const sessionToken = cookieValue(request, SESSION_COOKIE);
  if (!sessionToken) {
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
