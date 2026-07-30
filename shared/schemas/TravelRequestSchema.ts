import { z } from "zod";
import { AuditEventSchema, WorkflowStageSchema } from "./WorkflowActionSchema.js";
import { PriceRevisionSchema } from "./PriceRevisionSchema.js";

export const AccommodationTypeSchema = z.enum([
  "none",
  "room-only",
  "room-and-food",
  "half-board",
  "bed-and-breakfast",
  "egas-arranged",
  "other-company-arranged",
  "employee-arranged",
]);

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
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(255).refine((name) => !/[\u0000-\u001f\u007f]/.test(name), {
    message: "Attachment names cannot contain control characters.",
  }),
  mimeType: z.string().trim().min(1).max(100),
  size: z.number().int().min(1).max(5 * 1024 * 1024),
  url: z.string().min(1).max(7 * 1024 * 1024),
}).superRefine((attachment, context) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(attachment.mimeType)) {
    context.addIssue({
      code: "custom",
      message: "Ticket attachments must be JPEG, PNG, or WebP images.",
      path: ["mimeType"],
    });
  }
  const expectedPrefix = `data:${attachment.mimeType};base64,`;
  const payload = attachment.url.startsWith(expectedPrefix)
    ? attachment.url.slice(expectedPrefix.length)
    : "";
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    context.addIssue({
      code: "custom",
      message: "The attachment must be a valid base64 data URL matching its MIME type.",
      path: ["url"],
    });
  }
});

export const CreateTravelRequestInputSchema = z.object({
  originCity: z.string().trim().min(1).max(100).optional(),
  destinationCity: z.string().trim().min(1).max(100),
  departureAt: z.string().datetime(),
  returnAt: z.string().datetime(),
  tripType: z.enum(["one-way", "round-trip"]),
  managerId: z.string().trim().min(1).max(100),
  accommodationType: AccommodationTypeSchema,
  transportationMethod: z.string().trim().min(1).max(200),
  jobLevel: z.enum([
    "Chairman",
    "Deputy",
    "Advisor",
    "Expert",
    "Assistant",
    "Deputy Assistant",
    "General Manager",
    "Assistant General Manager",
    "Level 1",
    "Level 2",
    "Level 3",
  ]).optional(),
  claimedTransportationCost: z.number().finite().min(0).max(1_000_000_000).multipleOf(0.01).optional(),
  notes: z.string().trim().max(1000).optional(),
  attachments: z.array(RequestAttachmentSchema).max(4).optional(),
}).superRefine((data, context) => {
  const departure = new Date(data.departureAt).getTime();
  const arrival = new Date(data.returnAt).getTime();
  const valid = data.tripType === "one-way"
    ? arrival === departure
    : arrival > departure;
  if (!valid) {
    context.addIssue({
      code: "custom",
      message: data.tripType === "one-way"
        ? "A one-way request must use the departure time as returnAt."
        : "returnAt must be after departureAt.",
      path: ["returnAt"],
    });
  }

  const isPersonalCar = data.transportationMethod.includes("personal-car") || data.transportationMethod.includes("Private Car") || data.transportationMethod.includes("العامل");
  if (isPersonalCar && (!data.attachments || data.attachments.length === 0)) {
    context.addIssue({
      code: "custom",
      message: "Attach the required ticket/supporting document when using Employee's Private Car.",
      path: ["attachments"],
    });
  }
});

export const TravelRequestSchema = CreateTravelRequestInputSchema.safeExtend({
  id: z.string(),
  employeeId: z.string(),
  originCity: z.string(),
  stage: WorkflowStageSchema,
  verifiedDepartureAt: z.string().datetime().nullable(),
  verifiedReturnAt: z.string().datetime().nullable(),
  verifiedSameDayHours: z.number().min(0),
  verifiedReturnDayHours: z.number().min(0),
  transportationCost: z.number().min(0),
  transportationCostVerified: z.boolean(),
  claimedTransportationCost: z.number().min(0),
  bonusAmount: z.number().min(0),
  penaltyAmount: z.number().min(0),
  salaryPreview: SalaryCalculationResultSchema,
  finalSalary: SalaryCalculationResultSchema.nullable(),
  cancellationReason: z.string().nullable(),
  notes: z.string(),
  attachments: z.array(RequestAttachmentSchema),
  priceRevisions: z.array(PriceRevisionSchema),
  pendingEmployeeResponse: z.boolean(),
  timeNeedsVerification: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  auditEvents: z.array(AuditEventSchema),
  submittedRequest: CreateTravelRequestInputSchema,
});
