import { Router, type NextFunction, type Request, type Response } from "express";
import type { SystemRole, WorkflowStage } from "@travel-reimbursement/shared";

import { ApiError } from "../errors/ApiError.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createNewRequest } from "../services/requestService.js";
import { authorizedView } from "../services/responseViews.js";
import { recalculateSalaryPreview } from "../services/salaryService.js";
import { editRequest } from "../services/workflowService.js";
import {
  createRequest,
  findRequestById,
  findUserById,
  listRequestsByOwner,
  listRequestsForRole,
  replaceRequest,
} from "../storage/memoryStore.js";
import {
  CreateRequestBodySchema,
  PatchRequestBodySchema,
} from "../validation/requestSchemas.js";

export const requestRouter = Router();
requestRouter.use("/requests", authMiddleware);

function administrativeRole(roles: readonly SystemRole[]): SystemRole | undefined {
  return roles.find((role) => role !== "employee");
}

function roleStage(role: SystemRole): WorkflowStage | null {
  const stages: Partial<Record<SystemRole, WorkflowStage>> = {
    manager: "manager-review",
    pr: "pr-review",
    transportation: "transportation-review",
    timing: "timing-review",
    salary: "salary-finalization",
  };
  return stages[role] ?? null;
}

requestRouter.get("/requests", (request: Request, response: Response, next: NextFunction) => {
  try {
    const user = request.currentUser!;
    const scope = typeof request.query.scope === "string" ? request.query.scope : "mine";
    if (scope === "mine") {
      response.json({
        requests: listRequestsByOwner(user.id).map((record) => authorizedView(record, user.id, user.roles)),
      });
      return;
    }
    if (scope === "queue") {
      const role = administrativeRole(user.roles);
      if (!role || !roleStage(role)) {
        throw new ApiError(403, "FORBIDDEN", "Only department reviewers can open an approval queue.");
      }
      response.json({
        requests: listRequestsForRole(role).map((record) => authorizedView(record, user.id, user.roles, true)),
      });
      return;
    }
    throw new ApiError(400, "INVALID_SCOPE", "scope must be either mine or queue.");
  } catch (error) {
    next(error);
  }
});

requestRouter.get("/requests/:id", (request: Request, response: Response, next: NextFunction) => {
  try {
    const user = request.currentUser!;
    const record = findRequestById(String(request.params.id));
    if (!record) throw new ApiError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
    const isOwner = record.employeeId === user.id;
    const hasAdministrativeRole = administrativeRole(user.roles) !== undefined;
    if (!isOwner && !hasAdministrativeRole) {
      throw new ApiError(403, "FORBIDDEN", "You cannot view this travel request.");
    }
    response.json({ request: authorizedView(record, user.id, user.roles) });
  } catch (error) {
    next(error);
  }
});

requestRouter.post("/requests", (request: Request, response: Response, next: NextFunction) => {
  try {
    const user = request.currentUser!;
    if (!user.roles.includes("employee")) {
      throw new ApiError(403, "FORBIDDEN", "Only employees can create travel requests.");
    }
    const input = CreateRequestBodySchema.parse(request.body);
    const created = createRequest(createNewRequest(input, user));
    response.status(201).json({ request: authorizedView(created, user.id, user.roles) });
  } catch (error) {
    next(error);
  }
});

requestRouter.patch("/requests/:id", (request: Request, response: Response, next: NextFunction) => {
  try {
    const user = request.currentUser!;
    const record = findRequestById(String(request.params.id));
    if (!record) throw new ApiError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
    if (record.employeeId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "Only the request owner can correct it.");
    }
    const edits = PatchRequestBodySchema.parse(request.body);
    if (Object.keys(edits).length === 0) {
      throw new ApiError(400, "EMPTY_REQUEST_UPDATE", "Provide at least one editable request field.");
    }
    const departureAt = edits.departureAt ?? record.departureAt;
    const returnAt = edits.returnAt ?? record.returnAt;
    if (new Date(returnAt).getTime() <= new Date(departureAt).getTime()) {
      throw new ApiError(400, "INVALID_TRAVEL_DATES", "returnAt must be after departureAt.");
    }
    const originCity = edits.originCity ?? record.originCity;
    const destinationCity = edits.destinationCity ?? record.destinationCity;
    if (originCity.trim().toLowerCase() === destinationCity.trim().toLowerCase()) {
      throw new ApiError(409, "CONFLICT", "Origin and destination must be different.");
    }
    const updated = editRequest(
      record,
      user.id,
      "employee",
      edits,
      typeof request.body.note === "string" ? request.body.note : null,
    );
    const owner = findUserById(updated.employeeId);
    if (!owner) throw new ApiError(500, "REQUEST_OWNER_NOT_FOUND", "The request owner could not be resolved.");
    updated.salaryPreview = recalculateSalaryPreview(updated, owner);
    const stored = replaceRequest(updated.id, updated);
    if (!stored) throw new ApiError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
    response.json({ request: authorizedView(stored, user.id, user.roles) });
  } catch (error) {
    next(error);
  }
});
