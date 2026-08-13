import {
  AccommodationTypeSchema,
  CreateTravelRequestInputSchema,
  JobLevelSchema,
} from "@travel-reimbursement/shared";
import { z } from "zod";

export const CreateRequestBodySchema = CreateTravelRequestInputSchema
  .safeExtend({
    jobLevel: JobLevelSchema,
    destinationCity: z.string().trim().min(1, "Destination city is required.").max(100),
    transportationMethod: z.string().trim().min(1, "Transportation method is required.").max(200),
    notes: z.string().trim().min(1, "The mission purpose is required.").max(1000),
  })
  .refine((data) => !data.originCity || data.originCity.toLowerCase() !== data.destinationCity.toLowerCase(), {
    message: "Origin and destination must be different.",
    path: ["destinationCity"],
  });

export const PatchRequestBodySchema = z.object({
  originCity: z.string().trim().min(1).max(100).optional(),
  destinationCity: z.string().trim().min(1).max(100).optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  accommodationType: AccommodationTypeSchema.optional(),
  transportationMethod: z.string().trim().min(1).max(200).optional(),
  claimedTransportationCost: z.number().finite().min(0).max(1_000_000_000).multipleOf(0.01).optional(),
  notes: z.string().trim().max(1000).optional(),
  attachments: CreateTravelRequestInputSchema.shape.attachments.optional(),
});
