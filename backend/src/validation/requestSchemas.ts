import {
  AccommodationTypeSchema,
  CreateTravelRequestInputSchema,
} from "@travel-reimbursement/shared";
import { z } from "zod";

export const CreateRequestBodySchema = CreateTravelRequestInputSchema
  .extend({
    destinationCity: z.string().trim().min(1, "Destination city is required."),
    transportationMethod: z.string().trim().min(1, "Transportation method is required."),
  })
  .refine((data) => new Date(data.returnAt).getTime() > new Date(data.departureAt).getTime(), {
    message: "returnAt must be after departureAt.",
    path: ["returnAt"],
  })
  .refine((data) => !data.originCity || data.originCity.toLowerCase() !== data.destinationCity.toLowerCase(), {
    message: "Origin and destination must be different.",
    path: ["destinationCity"],
  });

export const PatchRequestBodySchema = z.object({
  originCity: z.string().trim().min(1).optional(),
  destinationCity: z.string().trim().min(1).optional(),
  departureAt: z.string().datetime().optional(),
  returnAt: z.string().datetime().optional(),
  accommodationType: AccommodationTypeSchema.optional(),
  transportationMethod: z.string().trim().min(1).optional(),
  claimedTransportationCost: z.number().finite().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
  attachments: CreateTravelRequestInputSchema.shape.attachments.optional(),
});
