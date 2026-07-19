import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../errors/ApiError.js";
import {
  WorkflowServiceError,
  type WorkflowErrorCode,
} from "../services/workflowService.js";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

const WORKFLOW_ERROR_STATUSES: Readonly<Record<WorkflowErrorCode, number>> = {
  UNAUTHORIZED_ACTION: 403,
  INVALID_EDIT_FIELDS: 400,
  INVALID_DATE: 400,
  INVALID_TRANSITION: 409,
  REQUEST_ALREADY_COMPLETED: 409,
  REQUEST_ALREADY_CANCELLED: 409,
  EDIT_WINDOW_EXPIRED: 409,
  ALREADY_SUBMITTED: 409,
};

function responseBody(code: string, message: string, details: unknown = null): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

function isInvalidJsonError(error: unknown): error is SyntaxError & { status: number; body: unknown } {
  return (
    error instanceof SyntaxError
    && "status" in error
    && error.status === 400
    && "body" in error
  );
}

/** Converts every API failure into the same safe JSON response shape. */
export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    response
      .status(error.status)
      .json(responseBody(error.code, error.message, error.details));
    return;
  }

  if (error instanceof WorkflowServiceError) {
    response
      .status(WORKFLOW_ERROR_STATUSES[error.code])
      .json(responseBody(error.code, error.message));
    return;
  }

  if (error instanceof ZodError) {
    response
      .status(400)
      .json(responseBody("VALIDATION_ERROR", "The request data is invalid.", error.issues));
    return;
  }

  if (isInvalidJsonError(error)) {
    response
      .status(400)
      .json(responseBody("INVALID_JSON", "The request body contains invalid JSON."));
    return;
  }

  response
    .status(500)
    .json(responseBody("INTERNAL_SERVER_ERROR", "An unexpected error occurred."));
};
