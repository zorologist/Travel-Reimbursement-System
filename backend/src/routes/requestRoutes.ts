import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type { TravelRequest } from "../../../shared/types/TravelRequest.js";
import { CreateTravelRequestInputSchema } from "../../../shared/schemas/TravelRequestSchema.js";
import { requireAuth } from "../middleware/authorizeRole.js";
import { ForbiddenError, NotFoundError } from "../middleware/errorHandler.js";
import { buildNewTravelRequest } from "../services/requestService.js";
import { editRequest } from "../services/workflowService.js";
import { createRequest, findRequestById, listRequests, updateRequest } from "../storage/memoryStore.js";

const router = Router();
router.use(requireAuth);

/**
 * Per the business rule "Visibility: all edits and changes visible to everyone
 * in the workflow + employee" — employees are scoped to their own request,
 * every other role can see every request (not just ones at their own stage).
 */
function canView(request: TravelRequest, userId: string, roles: readonly string[]): boolean {
  return request.employeeId === userId || roles.some((role) => role !== "employee");
}

router.get("/", (req: Request, res: Response) => {
  const { id, roles } = req.user!;
  res.json(listRequests().filter((request) => canView(request, id, roles)));
});

router.post("/", (req: Request, res: Response) => {
  const input = CreateTravelRequestInputSchema.parse(req.body);
  const request = buildNewTravelRequest(input, req.user!);
  createRequest(request);
  res.status(201).json(request);
});

router.get("/:id", (req: Request, res: Response) => {
  const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const request = findRequestById(requestId);
  if (!request) throw new NotFoundError("Travel request");
  if (!canView(request, req.user!.id, req.user!.roles)) throw new ForbiddenError();
  res.json(request);
});

// Employee self-correction, before Manager review — see workflowService.canEdit's
// 30-minute window for the "employee" role. Only fields an employee is allowed
// to submit in the first place are editable here.
const EmployeeCorrectionSchema = CreateTravelRequestInputSchema.partial().extend({
  note: z.string().nullable().optional(),
});

router.patch("/:id", (req: Request, res: Response) => {
  const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const request = findRequestById(requestId);
  if (!request) throw new NotFoundError("Travel request");
  if (request.employeeId !== req.user!.id) {
    throw new ForbiddenError("You may correct only your own request.");
  }

  const { note, ...edits } = EmployeeCorrectionSchema.parse(req.body);
  const updated = editRequest(request, req.user!.id, "employee", edits, note ?? null);
  updateRequest(updated);
  res.json(updated);
});

export default router;