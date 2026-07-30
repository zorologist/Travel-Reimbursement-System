import { Router } from "express";
import { z } from "zod";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizedView } from "../services/responseViews.js";
import {
  approveWorkflowRequest,
  finalizeSalaryRequest,
  rejectWorkflowRequest,
  requestInfoFromEmployee,
  reviewWorkflowRequest,
} from "../services/workflowApplicationService.js";
import {
  ApproveRequestInputSchema,
  FinalizeRequestInputSchema,
  RejectRequestInputSchema,
  DepartmentReviewInputSchema,
} from "../validation/workflowSchemas.js";

export const workflowRouter = Router();
workflowRouter.use("/requests/:id", authMiddleware);

const RequestInfoInputSchema = z.object({
  note: z.string().trim().min(1).max(1000),
});

workflowRouter.post("/requests/:id/approve", (request, response, next) => {
  try {
    const input = ApproveRequestInputSchema.parse(request.body);
    const record = approveWorkflowRequest(String(request.params.id), request.currentUser!, input);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});

workflowRouter.post("/requests/:id/reject", (request, response, next) => {
  try {
    const input = RejectRequestInputSchema.parse(request.body);
    const record = rejectWorkflowRequest(String(request.params.id), request.currentUser!, input.reason);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});

workflowRouter.patch("/requests/:id/review", (request, response, next) => {
  try {
    const input = DepartmentReviewInputSchema.parse(request.body);
    const record = reviewWorkflowRequest(String(request.params.id), request.currentUser!, input);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});

workflowRouter.post("/requests/:id/request-info", (request, response, next) => {
  try {
    const input = RequestInfoInputSchema.parse(request.body);
    const record = requestInfoFromEmployee(String(request.params.id), request.currentUser!, input.note);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});

workflowRouter.post("/requests/:id/finalize", (request, response, next) => {
  try {
    const input = FinalizeRequestInputSchema.parse(request.body ?? {});
    const record = finalizeSalaryRequest(String(request.params.id), request.currentUser!, input.note);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});
