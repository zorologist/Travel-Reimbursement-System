import type {
  AccommodationType,
  AuditEvent,
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
  accommodationType: AccommodationType;
  transportationMethod: string;
  transportationCost?: number;
  notes?: string;
  attachments?: RequestAttachment[];
}

export type RequestStatus = "in-progress" | "completed" | "cancelled";

export interface RequestResponse {
  id: string;
  employeeId: string;
  originCity: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  notes?: string;
  attachments?: RequestAttachment[];
  status: RequestStatus;
  stage: WorkflowStage;
  cancellationReason?: string;
  finalPrice?: number;
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
    accommodationType: record.accommodationType,
    transportationMethod: record.transportationMethod,
    notes: record.notes,
    attachments: record.attachments,
    status: statusFor(record.stage),
    stage: record.stage,
    cancellationReason: record.cancellationReason ?? undefined,
    finalPrice: record.finalSalary?.totalAmount,
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
  accommodationType: AccommodationType;
  transportationMethod: string;
  notes?: string;
  attachments?: RequestAttachment[];
  stage: WorkflowStage;
  cancellationReason?: string | null;
  finalSalary?: { totalAmount: number } | null;
  createdAt: string;
  updatedAt: string;
  auditEvents?: AuditEvent[];
}

export function mapBackendRequest(view: BackendRequestView): RequestDetailsResponse {
  return {
    id: view.id,
    employeeId: view.employeeId,
    employee: view.employee ?? { employeeNumber: view.employeeId, displayName: "Employee", department: "Unknown" },
    originCity: view.originCity,
    destinationCity: view.destinationCity,
    departureAt: view.departureAt,
    returnAt: view.returnAt,
    accommodationType: view.accommodationType,
    transportationMethod: view.transportationMethod,
    notes: view.notes,
    attachments: view.attachments ?? [],
    status: statusFor(view.stage),
    stage: view.stage,
    cancellationReason: view.cancellationReason ?? undefined,
    finalPrice: view.finalSalary?.totalAmount,
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
    const { transportationCost, ...requestData } = data;
    const response = await api.post<{ request: BackendRequestView }>("/api/requests", {
      ...requestData,
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
      return publicRequest(record);
    }
    const response = await api.get<{ request: BackendRequestView }>(`/api/requests/${id}`);
    return mapBackendRequest(response.data.request);
  },
};
