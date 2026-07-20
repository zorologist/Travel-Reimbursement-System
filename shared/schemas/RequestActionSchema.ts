import { z } from "zod";
import { AccommodationTypeSchema } from "./TravelRequestSchema.js";

const MoneySchema = z.number().finite().min(0).multipleOf(0.01);

export const ApproveRequestInputSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
  accommodationType: AccommodationTypeSchema.optional(),
  destination: z.string().trim().min(1).optional(),
  method: z.string().trim().min(1).optional(),
  transportationCost: MoneySchema.optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  meetsSevenHourRule: z.boolean().optional(),
});

export const RejectRequestInputSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const SalaryReviewInputSchema = z.object({
  bonusAmount: MoneySchema,
  penaltyAmount: MoneySchema,
  note: z.string().trim().max(1000),
}).superRefine((value, context) => {
  if ((value.bonusAmount > 0 || value.penaltyAmount > 0) && !value.note) {
    context.addIssue({ code: "custom", message: "A note is required for a non-zero salary adjustment.", path: ["note"] });
  }
});

export const DepartmentReviewInputSchema = z.object({
  accommodationType: AccommodationTypeSchema.optional(),
  destination: z.string().trim().min(1).optional(),
  method: z.string().trim().min(1).optional(),
  transportationCost: MoneySchema.optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  meetsSevenHourRule: z.boolean().optional(),
  bonusAmount: MoneySchema.optional(),
  penaltyAmount: MoneySchema.optional(),
  note: z.string().trim().max(1000).optional(),
}).refine((value) => Object.entries(value).some(([key, item]) => key !== "note" && item !== undefined), {
  message: "Provide at least one review field.",
});

export const FinalizeRequestInputSchema = z.object({
  note: z.string().trim().min(1).max(1000),
});
