import type {
  AccommodationType,
  AuditEvent,
  CreateTravelRequestInput,
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
  originCity: string;
  tripType: "one-way" | "round-trip";
  notes: string;
  attachments: TravelRequest["attachments"];
  claimedTransportationCost: number;
  transportationCostVerified: boolean;
  submittedRequest: CreateTravelRequestInput;
  auditEvents: AuditEvent[];
  verifiedDepartureAt?: string | null;
  verifiedReturnAt?: string | null;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  calculation: SalaryCalculationResult;
  revisions: SalaryPriceRevision[];
  status: "pending" | "completed";
  stage: TravelRequest["stage"];
  updatedAt: string;
}

export interface SalaryAdjustmentInput {
  transportationCost: number;
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
    originCity: record.originCity,
    tripType: record.tripType,
    notes: record.notes,
    attachments: record.attachments,
    claimedTransportationCost: record.claimedTransportationCost,
    transportationCostVerified: record.transportationCostVerified,
    submittedRequest: record.submittedRequest,
    auditEvents: record.auditEvents,
    verifiedDepartureAt: record.verifiedDepartureAt,
    verifiedReturnAt: record.verifiedReturnAt,
    verifiedSameDayHours: record.verifiedSameDayHours,
    verifiedReturnDayHours: record.verifiedReturnDayHours,
    calculation: record.finalSalary ?? record.salaryPreview,
    revisions: record.revisions,
    status: record.stage === "completed" ? "completed" : "pending",
    stage: record.stage,
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
    originCity: record.originCity ?? "Cairo",
    tripType: record.tripType ?? "round-trip",
    notes: record.notes ?? "",
    attachments: record.attachments ?? [],
    claimedTransportationCost: record.claimedTransportationCost ?? 0,
    transportationCostVerified: record.transportationCostVerified ?? false,
    submittedRequest: record.submittedRequest ?? {
      originCity: record.originCity ?? "Cairo", destinationCity: record.destinationCity,
      departureAt: record.departureAt, returnAt: record.returnAt, tripType: record.tripType ?? "round-trip",
      managerId: record.managerId ?? "", accommodationType: record.accommodationType,
      transportationMethod: record.transportationMethod, claimedTransportationCost: record.claimedTransportationCost ?? 0,
      notes: record.notes ?? "", attachments: record.attachments ?? [],
    },
    auditEvents: record.auditEvents ?? [],
    verifiedSameDayHours: record.verifiedSameDayHours ?? 0,
    verifiedReturnDayHours: record.verifiedReturnDayHours ?? 0,
    calculation,
    revisions: (record.priceRevisions ?? []).map((revision) => ({ id: revision.id, department: revision.actorRole, previousPrice: revision.previousCalculation.totalAmount, newPrice: revision.newCalculation.totalAmount, reason: revision.note, updatedAt: revision.createdAt })),
    status: record.stage === "completed" ? "completed" : "pending",
    stage: record.stage,
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
  /**
   * Backwards-compatible list of every request currently in the salary queue.
   * Returns the same data as the original `listQueue` — kept so existing callers
   * (and tests) continue to work. New code should prefer the three scoped
   * functions below so one tab's bug can't affect another tab's data.
   */
  async listQueue(): Promise<SalaryQueueItem[]> {
    if (useDevelopmentRepository) {
      const records = await developmentRepository.queueForRole("salary");
      return records.map(salaryItem);
    }
    const response = await api.get<{ requests: BackendSalaryView[] }>("/api/requests?scope=queue");
    return response.data.requests.map(mapBackendSalaryItem);
  },

  /**
   * Section 2 — "Track" tab. Returns the same underlying salary queue but as a
   * dedicated call so the Track tab can never accidentally clobber Check-Request
   * or Salary state.
   */
  async getTrackList(): Promise<SalaryQueueItem[]> {
    if (useDevelopmentRepository) return (await developmentRepository.listAll()).map(salaryItem);
    const response = await api.get<{ requests: BackendSalaryView[] }>("/api/requests?scope=payroll-track");
    return response.data.requests.map(mapBackendSalaryItem);
  },

  /**
   * Section 2 — "Check Request" tab. Filters the salary queue down to requests
   * that still need verification (i.e. not yet finalized). Independent state.
   */
  async getCheckRequestList(): Promise<SalaryQueueItem[]> {
    const items = await this.listQueue();
    return items.filter((item) => item.status !== "completed");
  },

  /**
   * Section 2 — "Salary" tab. Filters the salary queue down to requests that
   * have already been finalized this session. Independent state.
   */
  async getSalaryList(): Promise<SalaryQueueItem[]> {
    if (useDevelopmentRepository) return (await developmentRepository.listAll()).filter((item) => item.stage === "completed").map(salaryItem);
    const response = await api.get<{ requests: BackendSalaryView[] }>("/api/requests?scope=payroll-completed");
    return response.data.requests.map(mapBackendSalaryItem);
  },

  async updateAdjustments(requestId: string, input: SalaryAdjustmentInput): Promise<SalaryQueueItem> {
    assertMoney(input.transportationCost, "Verified ticket price");
    assertMoney(input.bonusAmount, "Bonus");
    assertMoney(input.penaltyAmount, "Penalty");
    if ((input.bonusAmount > 0 || input.penaltyAmount > 0) && !input.note.trim()) {
      throw new ApiClientError(400, "ADJUSTMENT_NOTE_REQUIRED", "Add a note explaining every non-zero bonus or penalty.");
    }
    if (useDevelopmentRepository) {
      return salaryItem(await developmentRepository.updateSalary(requestId, input.transportationCost, input.bonusAmount, input.penaltyAmount, input.note));
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
