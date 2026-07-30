import type {
  AccommodationType,
  AuditEvent,
  PriceRevision,
  WorkflowStage,
  RequestAttachment,
} from "@travel-reimbursement/shared";

import api, { ApiClientError } from "./api";
import { getDevelopmentUser } from "./developmentAuth";
import {
  developmentRepository,
  type DevelopmentRequest,
} from "./developmentRepository";
import { useDevelopmentRepository } from "./runtimeMode";

export type { RequestAttachment } from "@travel-reimbursement/shared";

export interface TravelRequestData {
  originCity: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  tripType: "one-way" | "round-trip";
  managerId: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  transportationCost?: number;
  notes?: string;
  attachments?: RequestAttachment[];
}

export type RequestStatus = "in-progress" | "completed" | "cancelled";

/** Section 8 — per-line-item visibility: a public-facing summary of one price
 * revision (stage, actor, before/after, note). The backend's `ownerView`
 * redacts the full calculation breakdown for employees; this shape mirrors that
 * redacted payload so the frontend can render the same row format for both the
 * employee owner and the salary dashboard reviewer. */
export interface PublicPriceRevision {
  id: string;
  stage: WorkflowStage;
  actorRole: string;
  previousAmount: number;
  newAmount: number;
  difference: number;
  note: string;
  createdAt: string;
}

export interface RequestResponse {
  id: string;
  employeeId: string;
  originCity: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  tripType?: "one-way" | "round-trip";
  managerId?: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  notes?: string;
  attachments?: RequestAttachment[];
  status: RequestStatus;
  stage: WorkflowStage;
  cancellationReason?: string;
  finalPrice?: number;
  pendingEmployeeResponse?: boolean;
  timeNeedsVerification?: boolean;
  publicRevisions?: PublicPriceRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestDetailsResponse extends RequestResponse {
  employee: {
    employeeNumber: string;
    displayName: string;
    department: string;
  };
  auditEvents: AuditEvent[];
}

function statusFor(stage: WorkflowStage): RequestStatus {
  if (stage === "completed") return "completed";
  if (stage === "cancelled") return "cancelled";
  return "in-progress";
}

/** Normalize a price revision (which may come in as either the full shared
 *  PriceRevision shape or the redacted owner-facing shape) into the public
 *  PublicPriceRevision we render in the tracker. */
function toPublicRevision(
  revision: PriceRevision | PublicPriceRevision,
): PublicPriceRevision {
  // The redacted shape (from ownerView) already exposes previousAmount/newAmount
  // directly; the full shape (from departmentView) has them nested in
  // previousCalculation/newCalculation.
  const fullRevision = revision as PriceRevision;
  if (typeof (fullRevision as unknown as { previousAmount?: number }).previousAmount === "number") {
    return revision as PublicPriceRevision;
  }
  return {
    id: fullRevision.id,
    stage: fullRevision.stage,
    actorRole: fullRevision.actorRole,
    previousAmount: fullRevision.previousCalculation.totalAmount,
    newAmount: fullRevision.newCalculation.totalAmount,
    difference: fullRevision.difference,
    note: fullRevision.note,
    createdAt: fullRevision.createdAt,
  };
}

function publicRequest(record: DevelopmentRequest): RequestDetailsResponse {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employee: {
      employeeNumber: record.employee.employeeNumber,
      displayName: record.employee.displayName,
      department: record.employee.department,
    },
    originCity: record.originCity,
    destinationCity: record.destinationCity,
    departureAt: record.departureAt,
    returnAt: record.returnAt,
    tripType: record.tripType,
    managerId: record.managerId,
    accommodationType: record.accommodationType,
    transportationMethod: record.transportationMethod,
    notes: record.notes,
    attachments: record.attachments,
    status: statusFor(record.stage),
    stage: record.stage,
    cancellationReason: record.cancellationReason ?? undefined,
    finalPrice: record.finalSalary?.totalAmount,
    pendingEmployeeResponse: record.pendingEmployeeResponse,
    timeNeedsVerification: record.timeNeedsVerification,
    publicRevisions: record.priceRevisions.map(toPublicRevision),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    auditEvents: record.auditEvents,
  };
}

interface BackendRequestView {
  id: string;
  employeeId: string;
  employee?: RequestDetailsResponse["employee"];
  originCity: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  tripType?: "one-way" | "round-trip";
  managerId?: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  notes?: string;
  attachments?: RequestAttachment[];
  stage: WorkflowStage;
  cancellationReason?: string | null;
  finalSalary?: { totalAmount: number } | null;
  pendingEmployeeResponse?: boolean;
  timeNeedsVerification?: boolean;
  priceRevisions?: PriceRevision[] | PublicPriceRevision[];
  createdAt: string;
  updatedAt: string;
  auditEvents?: AuditEvent[];
}

export function mapBackendRequest(view: BackendRequestView): RequestDetailsResponse {
  const rawRevisions = view.priceRevisions ?? [];
  return {
    id: view.id,
    employeeId: view.employeeId,
    employee: view.employee ?? { employeeNumber: view.employeeId, displayName: "Employee", department: "Unknown" },
    originCity: view.originCity,
    destinationCity: view.destinationCity,
    departureAt: view.departureAt,
    returnAt: view.returnAt,
    tripType: view.tripType,
    managerId: view.managerId,
    accommodationType: view.accommodationType,
    transportationMethod: view.transportationMethod,
    notes: view.notes,
    attachments: view.attachments ?? [],
    status: statusFor(view.stage),
    stage: view.stage,
    cancellationReason: view.cancellationReason ?? undefined,
    finalPrice: view.finalSalary?.totalAmount,
    pendingEmployeeResponse: view.pendingEmployeeResponse,
    timeNeedsVerification: view.timeNeedsVerification,
    publicRevisions: rawRevisions.map((revision) => toPublicRevision(revision as PriceRevision | PublicPriceRevision)),
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
    auditEvents: view.auditEvents ?? [],
  };
}

function currentDevelopmentEmployeeId(): string {
  return getDevelopmentUser()?.id ?? "u1";
}

export const requestApi = {
  async createRequest(data: TravelRequestData): Promise<RequestResponse> {
    if (useDevelopmentRepository) {
      const record = await developmentRepository.create({
        ...data,
        employeeId: currentDevelopmentEmployeeId(),
      });
      return publicRequest(record);
    }
    const { transportationCost, tripType, managerId, ...requestData } = data;
    const response = await api.post<{ request: BackendRequestView }>("/api/requests", {
      ...requestData,
      tripType,
      managerId,
      claimedTransportationCost: transportationCost,
    });
    return mapBackendRequest(response.data.request);
  },

  async getMyRequests(): Promise<RequestResponse[]> {
    if (useDevelopmentRepository) {
      const records = await developmentRepository.listForEmployee(currentDevelopmentEmployeeId());
      return records.map(publicRequest);
    }
    const response = await api.get<{ requests: BackendRequestView[] }>("/api/requests?scope=mine");
    return response.data.requests.map(mapBackendRequest);
  },

  async getRequest(id: string): Promise<RequestDetailsResponse> {
    if (useDevelopmentRepository) {
      const record = await developmentRepository.get(id);
      const user = getDevelopmentUser();
      if (user && user.roles.length === 1 && record.employeeId !== user.id) {
        throw new ApiClientError(403, "FORBIDDEN", "You cannot view another employee's request.");
      }
      if (user?.roles.includes("manager") && record.employeeId !== user.id && record.managerId !== user.id) {
        throw new ApiClientError(403, "FORBIDDEN", "Only the selected manager can view this request.");
      }
      if (user && record.employeeId !== user.id && !user.roles.includes("salary")) {
        const hasCurrentStageRole =
          (record.stage === "manager-review" && user.roles.includes("manager") && record.managerId === user.id)
          || (record.stage === "pr-review" && user.roles.includes("pr"))
          || (record.stage === "transportation-review" && user.roles.includes("transportation"))
          || (record.stage === "timing-review" && user.roles.includes("timing"));
        if (!hasCurrentStageRole) {
          throw new ApiClientError(403, "FORBIDDEN", "You cannot view this request outside your department stage.");
        }
      }
      return publicRequest(record);
    }
    const response = await api.get<{ request: BackendRequestView }>(`/api/requests/${id}`);
    return mapBackendRequest(response.data.request);
  },
};
