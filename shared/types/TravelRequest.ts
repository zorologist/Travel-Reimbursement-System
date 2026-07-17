import { WorkflowStage, AuditEvent } from "./Workflow";

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

export interface CreateTravelRequestInput {
  destinationCity: string;
  departureAt: string; // ISO 8601 string
  returnAt: string; // ISO 8601 string
  accommodationType: AccommodationType;
  transportationMethod: string;
}

export interface TravelRequest extends CreateTravelRequestInput {
  id: string;
  employeeId: string;
  stage: WorkflowStage;
  verifiedDepartureAt: string | null;
  verifiedReturnAt: string | null;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  salaryPreview: SalaryCalculationResult;
  finalSalary: SalaryCalculationResult | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  auditEvents: AuditEvent[];
}
