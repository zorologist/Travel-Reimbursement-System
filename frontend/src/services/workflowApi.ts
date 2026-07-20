import type { AccommodationType, JobLevel, PriceRevision as SharedPriceRevision, RequestAttachment, SalaryCalculationResult, SystemRole, TravelRequest, WorkflowStage } from "@travel-reimbursement/shared";

import api, { ApiClientError } from "./api";
import { getDevelopmentUser } from "./developmentAuth";
import {
  developmentRepository,
  type DevelopmentPriceRevision,
  type DevelopmentRequest,
} from "./developmentRepository";
import { useDevelopmentRepository } from "./runtimeMode";

type ReviewStage = Extract<WorkflowStage, "manager-review" | "pr-review" | "transportation-review" | "timing-review">;

export type PriceRevision = DevelopmentPriceRevision;

export interface ApprovalQueueItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  employeeJobLevel: JobLevel;
  status: string;
  currentStage: ReviewStage;
  initialPrice: number;
  currentPrice: number;
  revisions: PriceRevision[];
  attachments: RequestAttachment[];
  requestDetails: Partial<TravelRequest>;
}

interface BackendQueueView extends Partial<TravelRequest> {
  id: string;
  employeeId: string;
  employee?: { employeeNumber: string; displayName: string; department: string; jobLevel: JobLevel };
  stage: WorkflowStage;
  salaryPreview?: SalaryCalculationResult;
  priceRevisions?: SharedPriceRevision[];
  attachments?: RequestAttachment[];
}

export function mapBackendQueueItem(record: BackendQueueView): ApprovalQueueItem {
  const calculation = record.salaryPreview;
  const revisions = (record.priceRevisions ?? []).map((item) => ({
    id: item.id,
    department: item.actorRole,
    previousPrice: item.previousCalculation.totalAmount,
    newPrice: item.newCalculation.totalAmount,
    reason: item.note,
    updatedAt: item.createdAt,
  }));
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee?.displayName ?? "Employee",
    employeeNumber: record.employee?.employeeNumber ?? record.employeeId,
    department: record.employee?.department ?? "Unknown",
    employeeJobLevel: record.employee?.jobLevel ?? "Level 1",
    status: "pending",
    currentStage: record.stage as ReviewStage,
    initialPrice: revisions[0]?.previousPrice ?? calculation?.totalAmount ?? 0,
    currentPrice: calculation?.totalAmount ?? 0,
    revisions,
    attachments: record.attachments ?? [],
    requestDetails: record,
  };
}

const reviewRoles: readonly SystemRole[] = ["manager", "pr", "transportation", "timing"];

function currentReviewRole(): SystemRole {
  const role = getDevelopmentUser()?.roles.find((candidate) => reviewRoles.includes(candidate));
  if (!role) throw new ApiClientError(403, "FORBIDDEN", "Your account does not have a department review role.");
  return role;
}

function queueItem(record: DevelopmentRequest): ApprovalQueueItem {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee.displayName,
    employeeNumber: record.employee.employeeNumber,
    department: record.employee.department,
    employeeJobLevel: record.employee.jobLevel,
    status: "pending",
    currentStage: record.stage as ReviewStage,
    initialPrice: record.revisions[0]?.previousPrice ?? record.salaryPreview.totalAmount,
    currentPrice: record.salaryPreview.totalAmount,
    revisions: record.revisions,
    attachments: record.attachments,
    requestDetails: record,
  };
}

export const workflowApi = {
  async getQueue(): Promise<ApprovalQueueItem[]> {
    if (useDevelopmentRepository) {
      return (await developmentRepository.queueForRole(currentReviewRole())).map(queueItem);
    }
    const response = await api.get<{ requests: BackendQueueView[] }>("/api/requests?scope=queue");
    return response.data.requests.map(mapBackendQueueItem);
  },

  async approve(id: string, payload: Record<string, unknown>): Promise<void> {
    if (useDevelopmentRepository) {
      await developmentRepository.approve(id, currentReviewRole(), {
        note: typeof payload.reason === "string" ? payload.reason : undefined,
        revisedCost: typeof payload.revisedCost === "number" ? payload.revisedCost : undefined,
        accommodationType: typeof payload.accommodationType === "string" ? payload.accommodationType as AccommodationType : undefined,
        transportationCost: typeof payload.transportationCost === "number" ? payload.transportationCost : undefined,
        destination: typeof payload.destination === "string" ? payload.destination : undefined,
        method: typeof payload.method === "string" ? payload.method : undefined,
        departureAt: typeof payload.departureAt === "string" ? payload.departureAt : undefined,
        returnAt: typeof payload.returnAt === "string" ? payload.returnAt : undefined,
        meetsSevenHourRule: typeof payload.meetsSevenHourRule === "boolean" ? payload.meetsSevenHourRule : undefined,
      });
      return;
    }
    await api.post(`/api/requests/${id}/approve`, payload);
  },

  async reject(id: string, reason: string): Promise<void> {
    if (useDevelopmentRepository) {
      await developmentRepository.reject(id, currentReviewRole(), reason);
      return;
    }
    await api.post(`/api/requests/${id}/reject`, { reason });
  },
};
