// Unexpected API errors will be converted into one safe, consistent response by this middleware.
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { WorkflowServiceError, type WorkflowErrorCode } from "../services/workflowService.js";

/** Base class for HTTP-facing errors thrown anywhere in routes or services. */
export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends ApiError {
  public constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found.`);
  }
}

export class ForbiddenError extends ApiError {
  public constructor(message = "You are not permitted to perform this action.") {
    super(403, "FORBIDDEN", message);
  }
}

export class UnauthenticatedError extends ApiError {
  public constructor() {
    super(401, "UNAUTHENTICATED", "Sign in required.");
  }
}

const WORKFLOW_ERROR_STATUS: Record<WorkflowErrorCode, number> = {
  UNAUTHORIZED_ACTION: 403,
  INVALID_TRANSITION: 409,
  REQUEST_ALREADY_COMPLETED: 409,
  REQUEST_ALREADY_CANCELLED: 409,
  EDIT_WINDOW_EXPIRED: 403,
  INVALID_EDIT_FIELDS: 400,
  INVALID_DATE: 400,
  ALREADY_SUBMITTED: 409,
};

/**
 * Registered last in app.ts. Express 4 automatically routes synchronous throws
 * from route handlers here, so route/service code can simply `throw` instead of
 * calling `next(err)` manually — as long as the handler is not async without a
 * try/catch (none of the current routes are).
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof WorkflowServiceError) {
    res.status(WORKFLOW_ERROR_STATUS[err.code]).json({
      error: { code: err.code, message: err.message, details: null },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request body failed validation.",
        details: err.flatten(),
      },
    });
    return;
  }

  // Anything else is a bug, not a domain error. Never leak the stack to the client.
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", details: null },
  });
}