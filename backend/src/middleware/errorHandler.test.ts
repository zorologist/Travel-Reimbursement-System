import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { UserSchema } from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";
import { WorkflowServiceError } from "../services/workflowService.js";
import { errorHandler } from "./errorHandler.js";
import { notFoundHandler } from "./notFound.js";

function createTestApp() {
  const testApp = express();

  testApp.use(express.json());
  testApp.get("/api/expected", () => {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "You must sign in.");
  });
  testApp.get("/api/workflow/:code", (request_) => {
    throw new WorkflowServiceError(
      request_.params.code as ConstructorParameters<typeof WorkflowServiceError>[0],
      "Workflow action failed.",
    );
  });
  testApp.get("/api/validation", () => {
    z.object({ employeeId: z.string() }).parse({ employeeId: 42 });
  });
  testApp.get("/api/shared-validation", () => {
    UserSchema.parse({});
  });
  testApp.post("/api/json", (_request, response) => {
    response.status(204).end();
  });
  testApp.get("/api/unexpected", () => {
    throw new Error("Sensitive database information");
  });

  testApp.use(notFoundHandler);
  testApp.use(errorHandler);

  return testApp;
}

describe("errorHandler", () => {
  const testApp = createTestApp();

  it("returns an expected API error with its status and safe body", async () => {
    const response = await request(testApp).get("/api/expected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "You must sign in.",
        details: null,
      },
    });
  });

  it.each([
    ["UNAUTHORIZED_ACTION", 403],
    ["INVALID_EDIT_FIELDS", 400],
    ["INVALID_DATE", 400],
    ["INVALID_TRANSITION", 409],
    ["REQUEST_ALREADY_COMPLETED", 409],
    ["REQUEST_ALREADY_CANCELLED", 409],
    ["EDIT_WINDOW_EXPIRED", 409],
    ["ALREADY_SUBMITTED", 409],
  ])("maps workflow error %s to HTTP %i", async (code, status) => {
    const response = await request(testApp).get(`/api/workflow/${code}`);

    expect(response.status).toBe(status);
    expect(response.body).toEqual({
      error: {
        code,
        message: "Workflow action failed.",
        details: null,
      },
    });
  });

  it("returns useful Zod validation details", async () => {
    const response = await request(testApp).get("/api/validation");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("The request data is invalid.");
    expect(response.body.error.details).toEqual(expect.any(Array));
    expect(response.body.error.details[0].path).toEqual(["employeeId"]);
  });

  it("recognizes validation errors thrown by shared schemas", async () => {
    const response = await request(testApp).get("/api/shared-validation");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(expect.any(Array));
  });

  it("normalizes malformed JSON", async () => {
    const response = await request(testApp)
      .post("/api/json")
      .set("content-type", "application/json")
      .send('{"employeeId":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON.",
        details: null,
      },
    });
  });

  it("does not leak unexpected error information", async () => {
    const response = await request(testApp).get("/api/unexpected");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
        details: null,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("Sensitive database information");
  });
});
