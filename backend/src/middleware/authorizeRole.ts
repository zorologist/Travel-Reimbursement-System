import type { RequestHandler } from "express";
import type { SystemRole } from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";

export function authorizeRole(...roles: readonly SystemRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.currentUser) {
      next(new ApiError(401, "AUTHENTICATION_REQUIRED", "You must sign in."));
      return;
    }
    if (!roles.some((role) => request.currentUser?.roles.includes(role))) {
      next(new ApiError(403, "FORBIDDEN", "Your account cannot perform this action."));
      return;
    }
    next();
  };
}
