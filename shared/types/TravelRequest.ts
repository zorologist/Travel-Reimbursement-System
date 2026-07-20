import type { AuditEvent, WorkflowStage } from "./Workflow.js";
import type { PriceRevision } from "./PriceRevision.js";

export type AccommodationType = "none" | "room-only" | "room-and-food";

export interface SalaryCalculationResult {
  dailyRate: number;
  overnightCount: number;
  overnightAmount: number;
  sameDayAmount: number;
  returnDayAmount: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  totalAmount: number;
}

export interface RequestAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface CreateTravelRequestInput {
  originCity?: string;
  destinationCity: string;
  departureAt: string; // ISO 8601 string
  returnAt: string; // ISO 8601 string
  accommodationType: AccommodationType;
  transportationMethod: string;
  claimedTransportationCost?: number;
  notes?: string;
  attachments?: RequestAttachment[];
}

export interface TravelRequest extends CreateTravelRequestInput {
  id: string;
  employeeId: string;
  originCity: string;
  stage: WorkflowStage;
  verifiedDepartureAt: string | null;
  verifiedReturnAt: string | null;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  transportationCost: number;
  claimedTransportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  salaryPreview: SalaryCalculationResult;
  finalSalary: SalaryCalculationResult | null;
  cancellationReason: string | null;
  notes: string;
  attachments: RequestAttachment[];
  priceRevisions: PriceRevision[];
  createdAt: string;
  updatedAt: string;
  auditEvents: AuditEvent[];
}
