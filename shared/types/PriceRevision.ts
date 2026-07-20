import type { SalaryCalculationResult } from "./TravelRequest.js";
import type { SystemRole } from "./User.js";
import type { WorkflowStage } from "./Workflow.js";

export interface PriceRevision {
  id: string;
  requestId: string;
  stage: WorkflowStage;
  actorId: string;
  actorRole: SystemRole;
  previousCalculation: SalaryCalculationResult;
  newCalculation: SalaryCalculationResult;
  difference: number;
  changes: Record<string, { before: unknown; after: unknown }>;
  note: string;
  createdAt: string;
}
