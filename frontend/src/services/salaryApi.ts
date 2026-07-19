import {
  calculateSalary,
  type AccommodationType,
  type JobLevel,
  type SalaryCalculationInput,
  type SalaryCalculationResult,
} from "@travel-reimbursement/shared";

import api, { ApiClientError } from "./api";

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

interface DevelopmentSalaryRecord extends SalaryQueueItem {
  calculationInput: Omit<
    SalaryCalculationInput,
    "bonusAmount" | "penaltyAmount"
  >;
}

interface DevelopmentRecordInput {
  id: string;
  employeeNumber: string;
  displayName: string;
  department: string;
  jobLevel: JobLevel;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  overnightCount: number;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  transportationCost: number;
  updatedAt: string;
  revisions: SalaryPriceRevision[];
}

function buildDevelopmentRecord(input: DevelopmentRecordInput): DevelopmentSalaryRecord {
  const calculationInput: DevelopmentSalaryRecord["calculationInput"] = {
    jobLevel: input.jobLevel,
    accommodationType: input.accommodationType,
    overnightCount: input.overnightCount,
    isSameDayMission: input.overnightCount === 0,
    sameDayVerifiedHours: input.verifiedSameDayHours,
    returnDayVerifiedHours: input.verifiedReturnDayHours,
    transportationCost: input.transportationCost,
  };

  return {
    id: input.id,
    employee: {
      id: `employee-${input.employeeNumber}`,
      employeeNumber: input.employeeNumber,
      displayName: input.displayName,
      department: input.department,
      jobLevel: input.jobLevel,
    },
    destinationCity: input.destinationCity,
    departureAt: input.departureAt,
    returnAt: input.returnAt,
    accommodationType: input.accommodationType,
    transportationMethod: input.transportationMethod,
    verifiedSameDayHours: input.verifiedSameDayHours,
    verifiedReturnDayHours: input.verifiedReturnDayHours,
    calculation: calculateSalary({
      ...calculationInput,
      bonusAmount: 0,
      penaltyAmount: 0,
    }),
    revisions: input.revisions,
    status: "pending",
    updatedAt: input.updatedAt,
    calculationInput,
  };
}

function initialDevelopmentQueue(): DevelopmentSalaryRecord[] {
  return [
    buildDevelopmentRecord({
      id: "TR-2026-0841",
      employeeNumber: "DEV001",
      displayName: "Mariam Hassan (Demo)",
      department: "Offshore Operations",
      jobLevel: "Level 1",
      destinationCity: "Hurghada",
      departureAt: "2026-07-12T06:00:00.000Z",
      returnAt: "2026-07-17T18:00:00.000Z",
      accommodationType: "none",
      transportationMethod: "Company car",
      overnightCount: 4,
      verifiedSameDayHours: 0,
      verifiedReturnDayHours: 7,
      transportationCost: 200,
      updatedAt: "2026-07-19T12:20:00.000Z",
      revisions: [
        {
          id: "revision-0841-transportation",
          department: "Transportation",
          previousPrice: 602,
          newPrice: 802,
          reason: "Confirmed company-car transportation cost.",
          updatedAt: "2026-07-18T09:10:00.000Z",
        },
      ],
    }),
    buildDevelopmentRecord({
      id: "TR-2026-0839",
      employeeNumber: "DEV005",
      displayName: "Nour Samir (Demo PR)",
      department: "Geological Survey",
      jobLevel: "Assistant",
      destinationCity: "Matrouh",
      departureAt: "2026-07-10T07:00:00.000Z",
      returnAt: "2026-07-14T17:00:00.000Z",
      accommodationType: "room-only",
      transportationMethod: "Company bus",
      overnightCount: 3,
      verifiedSameDayHours: 0,
      verifiedReturnDayHours: 8,
      transportationCost: 150,
      updatedAt: "2026-07-19T10:05:00.000Z",
      revisions: [
        {
          id: "revision-0839-pr",
          department: "PR",
          previousPrice: 942,
          newPrice: 762,
          reason: "Room-only accommodation confirmed.",
          updatedAt: "2026-07-18T11:30:00.000Z",
        },
      ],
    }),
    buildDevelopmentRecord({
      id: "TR-2026-0836",
      employeeNumber: "DEV004",
      displayName: "Karim Adel (Demo Manager)",
      department: "Pipeline Engineering",
      jobLevel: "General Manager",
      destinationCity: "El-Arish",
      departureAt: "2026-07-08T08:00:00.000Z",
      returnAt: "2026-07-11T16:00:00.000Z",
      accommodationType: "room-and-food",
      transportationMethod: "Company bus",
      overnightCount: 2,
      verifiedSameDayHours: 0,
      verifiedReturnDayHours: 4,
      transportationCost: 100,
      updatedAt: "2026-07-19T08:40:00.000Z",
      revisions: [],
    }),
  ];
}

let developmentQueue = initialDevelopmentQueue();

function publicRecord(record: DevelopmentSalaryRecord): SalaryQueueItem {
  const { calculationInput: _calculationInput, ...item } = structuredClone(record);
  return item;
}

function assertMoney(value: number, field: string): void {
  const hasTooManyDecimals = Math.abs(value * 100 - Math.round(value * 100)) > 1e-8;
  if (!Number.isFinite(value) || value < 0 || hasTooManyDecimals) {
    throw new ApiClientError(
      400,
      "INVALID_SALARY_ADJUSTMENT",
      `${field} must be a non-negative amount with at most two decimal places.`,
    );
  }
}

function developmentRecord(requestId: string): DevelopmentSalaryRecord {
  const record = developmentQueue.find((candidate) => candidate.id === requestId);
  if (!record) {
    throw new ApiClientError(404, "REQUEST_NOT_FOUND", "Salary request not found.");
  }
  if (record.status !== "pending") {
    throw new ApiClientError(409, "REQUEST_ALREADY_COMPLETED", "This request is already finalized.");
  }
  return record;
}

async function developmentDelay(): Promise<void> {
  await Promise.resolve();
}

export const salaryApi = {
  async listQueue(): Promise<SalaryQueueItem[]> {
    if (import.meta.env.DEV) {
      await developmentDelay();
      return developmentQueue
        .filter((record) => record.status === "pending")
        .map(publicRecord);
    }

    const response = await api.get<SalaryQueueItem[]>("/api/requests?scope=queue");
    return response.data;
  },

  async updateAdjustments(
    requestId: string,
    input: SalaryAdjustmentInput,
  ): Promise<SalaryQueueItem> {
    assertMoney(input.bonusAmount, "Bonus");
    assertMoney(input.penaltyAmount, "Penalty");
    if ((input.bonusAmount > 0 || input.penaltyAmount > 0) && !input.note.trim()) {
      throw new ApiClientError(
        400,
        "ADJUSTMENT_NOTE_REQUIRED",
        "Add a note explaining every non-zero bonus or penalty.",
      );
    }

    if (import.meta.env.DEV) {
      await developmentDelay();
      const record = developmentRecord(requestId);
      const previousPrice = record.calculation.totalAmount;
      const adjustmentChanged =
        record.calculation.bonusAmount !== input.bonusAmount ||
        record.calculation.penaltyAmount !== input.penaltyAmount;
      record.calculation = calculateSalary({
        ...record.calculationInput,
        bonusAmount: input.bonusAmount,
        penaltyAmount: input.penaltyAmount,
      });
      record.updatedAt = new Date().toISOString();
      if (adjustmentChanged) {
        record.revisions.push({
          id: `revision-${requestId}-salary-${record.revisions.length + 1}`,
          department: "Salary",
          previousPrice,
          newPrice: record.calculation.totalAmount,
          reason: input.note.trim(),
          updatedAt: record.updatedAt,
        });
      }
      return publicRecord(record);
    }

    const response = await api.patch<SalaryQueueItem>(
      `/api/requests/${requestId}/review`,
      input,
    );
    return response.data;
  },

  async finalize(requestId: string, note: string): Promise<SalaryQueueItem> {
    if (!note.trim()) {
      throw new ApiClientError(
        400,
        "FINALIZATION_NOTE_REQUIRED",
        "A finalization note is required.",
      );
    }

    if (import.meta.env.DEV) {
      await developmentDelay();
      const record = developmentRecord(requestId);
      record.status = "completed";
      record.updatedAt = new Date().toISOString();
      return publicRecord(record);
    }

    const response = await api.post<SalaryQueueItem>(
      `/api/requests/${requestId}/finalize`,
      { note: note.trim() },
    );
    return response.data;
  },
};

export function resetSalaryDevelopmentDataForTests(): void {
  developmentQueue = initialDevelopmentQueue();
}
