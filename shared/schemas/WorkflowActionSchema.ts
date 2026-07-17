import { z } from "zod";
import { SystemRoleSchema } from "./UserSchema";

export const WorkflowStageSchema = z.enum([
  "manager-review",
  "pr-review",
  "transportation-review",
  "timing-review",
  "salary-finalization",
  "completed",
  "cancelled",
]);

export const WorkflowActionSchema = z.enum([
  "submit",
  "approve",
  "reject",
  "edit",
  "finalize",
]);

export const AuditEventSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  actorId: z.string(),
  actorRole: SystemRoleSchema,
  action: WorkflowActionSchema,
  fromStage: WorkflowStageSchema.nullable(),
  toStage: WorkflowStageSchema,
  changes: z.record(z.string(), z.object({
    before: z.unknown(),
    after: z.unknown(),
  })),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});
