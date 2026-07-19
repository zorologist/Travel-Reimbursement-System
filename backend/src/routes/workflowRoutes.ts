import type { Request, Response } from "express";
import { Router } from "express";
import type { TravelRequest } from "../../../shared/types/TravelRequest.js";
import type { SystemRole } from "../../../shared/types/User.js";
import { reviewSchemaByStage, type ReviewableStage } from "../../../shared/schemas/WorkflowReviewSchema.js";
import { requireAuth } from "../middleware/authorizeRole.js";
import { ApiError, ForbiddenError, NotFoundError } from "../middleware/errorHandler.js";
import {
  approveRequest,
  canApprove,
  canEdit,
  canFinalize,
  canReject,
  editRequest,
  finalizeRequest,
  rejectRequest,
} from "../services/workflowService.js";
import { findRequestById, updateRequest } from "../storage/memoryStore.js";

const router = Router();
router.use(requireAuth);

function loadRequestOr404(id: string | string[] | undefined): TravelRequest {
  const idStr = Array.isArray(id) ? id[0] : id;
  if (!idStr) throw new NotFoundError("Travel request");
  const request = findRequestById(idStr);
  if (!request) throw new NotFoundError("Travel request");
  return request;
}

/**
 * A user's `roles` array may contain more than one role. Find the one that
 * actually applies to this request at its current stage, rather than assuming
 * the first role in the list — this keeps the backend authoritative even if
 * the frontend guesses wrong about which role is "active" for the user.
 */
function resolveRole(
  request: TravelRequest,
  roles: readonly SystemRole[],
  // check may require additional args (actorId, options, ...)
  check: (request: TravelRequest, role: SystemRole, ...rest: any[]) => boolean,
    ...extra: any[]
): SystemRole {
  const role = roles.find((candidate) => check(request, candidate, ...extra));
  if (!role) {
    throw new ForbiddenError("None of your roles permit this action at the request's current stage.");
  }
  return role;
}

router.post("/:id/approve", (req: Request, res: Response) => {
  const request = loadRequestOr404(req.params.id);
  const role = resolveRole(request, req.user!.roles, canApprove, req.user!.id);
  const updated = approveRequest(request, req.user!.id, role, req.body?.note ?? null);
  updateRequest(updated);
  res.json(updated);
});

// Manager-only, per "Manager Rejection is Final: stops entire flow" — enforced
// again here at the route boundary via canReject, on top of workflowService's
// own check, since the frontend cannot be trusted to hide this from other roles.
router.post("/:id/reject", (req: Request, res: Response) => {
  const request = loadRequestOr404(req.params.id);
  const role = resolveRole(request, req.user!.roles, canReject, req.user!.id);
  const updated = rejectRequest(request, req.user!.id, role, req.body?.note ?? null);
  updateRequest(updated);
  res.json(updated);
});

router.patch("/:id/review", (req: Request, res: Response) => {
  const request = loadRequestOr404(req.params.id);
  const role = resolveRole(request, req.user!.roles, canEdit, req.user!.id);

  // Schema is chosen by the request's CURRENT stage, not the caller's role —
  // so a request only ever accepts the edit shape for the stage it's actually in.
  const schema = reviewSchemaByStage[request.stage as ReviewableStage];
  if (!schema) {
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      `Request in stage "${request.stage}" does not accept department review.`,
    );
  }

  const { note, ...edits } = schema.parse(req.body);
  const updated = editRequest(request, req.user!.id, role, edits, note ?? null);
  updateRequest(updated);
  res.json(updated);
});

router.post("/:id/finalize", (req: Request, res: Response) => {
  const request = loadRequestOr404(req.params.id);
  const role = resolveRole(request, req.user!.roles, canFinalize, req.user!.id);
  const updated = finalizeRequest(request, req.user!.id, role, req.body?.note ?? null);
  updateRequest(updated);
  res.json(updated);
});

export default router;