import { z } from "zod";
import { AuditEventSchema, WorkflowStageSchema } from "./WorkflowActionSchema.js";
import { PriceRevisionSchema } from "./PriceRevisionSchema.js";

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

export const RequestAttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  size: z.number().int().min(0).max(5 * 1024 * 1024),
  url: z.string().min(1).max(7 * 1024 * 1024),
});

export const CreateTravelRequestInputSchema = z.object({
  originCity: z.string().trim().min(1).optional(),
  destinationCity: z.string(),
  departureAt: z.string().datetime(),
  returnAt: z.string().datetime(),
  accommodationType: AccommodationTypeSchema,
  transportationMethod: z.string(),
  claimedTransportationCost: z.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
  attachments: z.array(RequestAttachmentSchema).max(5).optional(),
});

export const TravelRequestSchema = CreateTravelRequestInputSchema.extend({
  id: z.string(),
  employeeId: z.string(),
  originCity: z.string(),
  stage: WorkflowStageSchema,
  verifiedDepartureAt: z.string().datetime().nullable(),
  verifiedReturnAt: z.string().datetime().nullable(),
  verifiedSameDayHours: z.number().min(0),
  verifiedReturnDayHours: z.number().min(0),
  transportationCost: z.number().min(0),
  claimedTransportationCost: z.number().min(0),
  bonusAmount: z.number().min(0),
  penaltyAmount: z.number().min(0),
  salaryPreview: SalaryCalculationResultSchema,
  finalSalary: SalaryCalculationResultSchema.nullable(),
  cancellationReason: z.string().nullable(),
  notes: z.string(),
  attachments: z.array(RequestAttachmentSchema),
  priceRevisions: z.array(PriceRevisionSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  auditEvents: z.array(AuditEventSchema),
});
