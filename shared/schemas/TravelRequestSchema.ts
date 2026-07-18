import { z } from "zod";
import { AuditEventSchema, WorkflowStageSchema } from "./WorkflowActionSchema.js";

export const AccommodationTypeSchema = z.enum(["none", "room-only", "room-and-food"]);

export const SalaryCalculationResultSchema = z.object({
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

export const CreateTravelRequestInputSchema = z.object({
  destinationCity: z.string(),
  departureAt: z.string().datetime(),
  returnAt: z.string().datetime(),
  accommodationType: AccommodationTypeSchema,
  transportationMethod: z.string(),
});

export const TravelRequestSchema = CreateTravelRequestInputSchema.extend({
  id: z.string(),
  employeeId: z.string(),
  stage: WorkflowStageSchema,
  verifiedDepartureAt: z.string().datetime().nullable(),
  verifiedReturnAt: z.string().datetime().nullable(),
  verifiedSameDayHours: z.number().min(0),
  verifiedReturnDayHours: z.number().min(0),
  transportationCost: z.number().min(0),
  bonusAmount: z.number().min(0),
  penaltyAmount: z.number().min(0),
  salaryPreview: SalaryCalculationResultSchema,
  finalSalary: SalaryCalculationResultSchema.nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  auditEvents: z.array(AuditEventSchema),
});
