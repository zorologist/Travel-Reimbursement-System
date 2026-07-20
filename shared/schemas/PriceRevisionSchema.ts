import { z } from "zod";
import { SystemRoleSchema } from "./UserSchema.js";
import { WorkflowStageSchema } from "./WorkflowActionSchema.js";

const RevisionCalculationSchema = z.object({
  dailyRate: z.number(),
  overnightCount: z.number(),
  overnightAmount: z.number(),
  sameDayAmount: z.number(),
  returnDayAmount: z.number(),
  transportationCost: z.number(),
  bonusAmount: z.number(),
  penaltyAmount: z.number(),
  totalAmount: z.number(),
});

export const PriceRevisionSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  stage: WorkflowStageSchema,
  actorId: z.string().min(1),
  actorRole: SystemRoleSchema,
  previousCalculation: RevisionCalculationSchema,
  newCalculation: RevisionCalculationSchema,
  difference: z.number(),
  changes: z.record(z.string(), z.object({ before: z.unknown(), after: z.unknown() })),
  note: z.string(),
  createdAt: z.string().datetime(),
});
