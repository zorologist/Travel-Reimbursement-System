import type {
  AccommodationType,
  JobLevel,
  SalaryCalculationResult,
  PriceRevision,
  TravelRequest,
} from "@travel-reimbursement/shared";

import api, { ApiClientError } from "./api";
import {
  developmentRepository,
  resetDevelopmentRepositoryForTests,
  type DevelopmentRequest,
} from "./developmentRepository";
import { useDevelopmentRepository } from "./runtimeMode";

export interface SalaryPriceRevision {
  id: string;
  department: string;
  previousPrice: number;
  newPrice: number;
  reason: string;
  updatedAt: string;
}

export interface SalaryQueueItem {
  id: string;
  employee: {
    id: string;
    employeeNumber: string;
    displayName: string;
    department: string;
    jobLevel: JobLevel;
  };
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  calculation: SalaryCalculationResult;
  revisions: SalaryPriceRevision[];
  status: "pending" | "completed";
  updatedAt: string;
}

export interface SalaryAdjustmentInput {
  bonusAmount: number;
  penaltyAmount: number;
  note: string;
}

function salaryItem(record: DevelopmentRequest): SalaryQueueItem {
  return {
    id: record.id,
    employee: {
      id: record.employee.id,
      employeeNumber: record.employee.employeeNumber,
      displayName: record.employee.displayName,
      department: record.employee.department,
      jobLevel: record.employee.jobLevel,
    },
    destinationCity: record.destinationCity,
    departureAt: record.departureAt,
    returnAt: record.returnAt,
    accommodationType: record.accommodationType,
    transportationMethod: record.transportationMethod,
    verifiedSameDayHours: record.verifiedSameDayHours,
    verifiedReturnDayHours: record.verifiedReturnDayHours,
    calculation: record.finalSalary ?? record.salaryPreview,
    revisions: record.revisions,
    status: record.stage === "completed" ? "completed" : "pending",
    updatedAt: record.updatedAt,
  };
}

interface BackendSalaryView extends Partial<TravelRequest> {
  id: string;
  employee?: SalaryQueueItem["employee"];
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  salaryPreview?: SalaryCalculationResult;
  finalSalary?: SalaryCalculationResult | null;
  priceRevisions?: PriceRevision[];
  stage: TravelRequest["stage"];
  updatedAt: string;
}

export function mapBackendSalaryItem(record: BackendSalaryView): SalaryQueueItem {
  const calculation = record.finalSalary ?? record.salaryPreview;
  if (!calculation) throw new ApiClientError(500, "INVALID_SALARY_RESPONSE", "The salary calculation is missing from the server response.");
  return {
    id: record.id,
    employee: record.employee ?? { id: "unknown", employeeNumber: "Unknown", displayName: "Employee", department: "Unknown", jobLevel: "Level 1" },
    destinationCity: record.destinationCity,
    departureAt: record.departureAt,
    returnAt: record.returnAt,
    accommodationType: record.accommodationType,
    transportationMethod: record.transportationMethod,
    verifiedSameDayHours: record.verifiedSameDayHours ?? 0,
    verifiedReturnDayHours: record.verifiedReturnDayHours ?? 0,
    calculation,
    revisions: (record.priceRevisions ?? []).map((revision) => ({ id: revision.id, department: revision.actorRole, previousPrice: revision.previousCalculation.totalAmount, newPrice: revision.newCalculation.totalAmount, reason: revision.note, updatedAt: revision.createdAt })),
    status: record.stage === "completed" ? "completed" : "pending",
    updatedAt: record.updatedAt,
  };
}

function assertMoney(value: number, field: string): void {
  const hasTooManyDecimals = Math.abs(value * 100 - Math.round(value * 100)) > 1e-8;
  if (!Number.isFinite(value) || value < 0 || hasTooManyDecimals) {
    throw new ApiClientError(400, "INVALID_SALARY_ADJUSTMENT", `${field} must be a non-negative amount with at most two decimal places.`);
  }
}

export const salaryApi = {
  async listQueue(): Promise<SalaryQueueItem[]> {
    if (useDevelopmentRepository) {
      const records = await developmentRepository.queueForRole("salary");
      return records.map(salaryItem);
    }
    const response = await api.get<{ requests: BackendSalaryView[] }>("/api/requests?scope=queue");
    return response.data.requests.map(mapBackendSalaryItem);
  },

  async updateAdjustments(requestId: string, input: SalaryAdjustmentInput): Promise<SalaryQueueItem> {
    assertMoney(input.bonusAmount, "Bonus");
    assertMoney(input.penaltyAmount, "Penalty");
    if ((input.bonusAmount > 0 || input.penaltyAmount > 0) && !input.note.trim()) {
      throw new ApiClientError(400, "ADJUSTMENT_NOTE_REQUIRED", "Add a note explaining every non-zero bonus or penalty.");
    }
    if (useDevelopmentRepository) {
      return salaryItem(await developmentRepository.updateSalary(requestId, input.bonusAmount, input.penaltyAmount, input.note));
    }
    const response = await api.patch<{ request: BackendSalaryView }>(`/api/requests/${requestId}/review`, input);
    return mapBackendSalaryItem(response.data.request);
  },

  async finalize(requestId: string, note: string): Promise<SalaryQueueItem> {
    if (!note.trim()) {
      throw new ApiClientError(400, "FINALIZATION_NOTE_REQUIRED", "A finalization note is required.");
    }
    if (useDevelopmentRepository) return salaryItem(await developmentRepository.finalizeSalary(requestId, note));
    const response = await api.post<{ request: BackendSalaryView }>(`/api/requests/${requestId}/finalize`, { note: note.trim() });
    return mapBackendSalaryItem(response.data.request);
  },
};

export function resetSalaryDevelopmentDataForTests(): void {
  resetDevelopmentRepositoryForTests();
}
