import type { AuditEvent, WorkflowStage } from "./Workflow.js";
import type { PriceRevision } from "./PriceRevision.js";
import type { JobLevel } from "./User.js";

export type AccommodationType =
  | "none"
  | "room-only"
  | "room-and-food"
  | "half-board"
  | "bed-and-breakfast"
  | "egas-arranged"
  | "other-company-arranged"
  | "employee-arranged";

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
  tripType: "one-way" | "round-trip";
  managerId: string;
  jobLevel?: JobLevel;
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
  transportationCostVerified: boolean;
  claimedTransportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  salaryPreview: SalaryCalculationResult;
  finalSalary: SalaryCalculationResult | null;
  cancellationReason: string | null;
  notes: string;
  attachments: RequestAttachment[];
  priceRevisions: PriceRevision[];
  pendingEmployeeResponse: boolean;
  timeNeedsVerification: boolean;
  createdAt: string;
  updatedAt: string;
  auditEvents: AuditEvent[];
  /** Immutable copy of the form as it was first submitted. */
  submittedRequest: CreateTravelRequestInput;
}
