import { z } from "zod";
import { AccommodationTypeSchema } from "./TravelRequestSchema.js";

const MoneySchema = z.number().finite().min(0).max(1_000_000_000).multipleOf(0.01);

export const ApproveRequestInputSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
  accommodationType: AccommodationTypeSchema.optional(),
  destination: z.string().trim().min(1).max(100).optional(),
  method: z.string().trim().min(1).max(200).optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  meetsSevenHourRule: z.boolean().optional(),
});

export const RejectRequestInputSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const SalaryReviewInputSchema = z.object({
  transportationCost: MoneySchema,
  bonusAmount: MoneySchema,
  penaltyAmount: MoneySchema,
  note: z.string().trim().max(1000).optional().default(""),
});

export const DepartmentReviewInputSchema = z.object({
  accommodationType: AccommodationTypeSchema.optional(),
  destination: z.string().trim().min(1).max(100).optional(),
  method: z.string().trim().min(1).max(200).optional(),
  transportationCost: MoneySchema.optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  meetsSevenHourRule: z.boolean().optional(),
  bonusAmount: MoneySchema.optional(),
  penaltyAmount: MoneySchema.optional(),
  timeNeedsVerification: z.boolean().optional(),
  note: z.string().trim().max(1000).optional(),
}).refine((value) => Object.entries(value).some(([key, item]) => key !== "note" && item !== undefined), {
  message: "Provide at least one review field.",
});

export const FinalizeRequestInputSchema = z.object({
  note: z.string().trim().max(1000).optional().default(""),
});
