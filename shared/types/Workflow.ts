import { SystemRole } from "./User";

export type WorkflowStage =
  | "manager-review"
  | "pr-review"
  | "transportation-review"
  | "timing-review"
  | "salary-finalization"
  | "completed"
  | "cancelled";

export type WorkflowAction =
  | "submit"
  | "approve"
  | "reject"
  | "edit"
  | "finalize";

export interface AuditEvent {
  id: string;
  requestId: string;
  actorId: string;
  actorRole: SystemRole;
  action: WorkflowAction;
  fromStage: WorkflowStage | null;
  toStage: WorkflowStage;
  changes: Record<string, { before: unknown; after: unknown }>;
  note: string | null;
  createdAt: string;
}
