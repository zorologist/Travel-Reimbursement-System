import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizedView } from "../services/responseViews.js";
import {
  approveWorkflowRequest,
  finalizeSalaryRequest,
  rejectWorkflowRequest,
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

workflowRouter.post("/requests/:id/finalize", (request, response, next) => {
  try {
    const input = FinalizeRequestInputSchema.parse(request.body);
    const record = finalizeSalaryRequest(String(request.params.id), request.currentUser!, input.note);
    response.json({ request: authorizedView(record, request.currentUser!.id, request.currentUser!.roles, true) });
  } catch (error) {
    next(error);
  }
});
