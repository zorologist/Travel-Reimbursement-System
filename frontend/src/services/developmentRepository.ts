import {
  calculateSalary,
  type AccommodationType,
  type AuditEvent,
  type JobLevel,
  type SalaryCalculationResult,
  type SystemRole,
  type TravelRequest,
  type User,
  type WorkflowStage,
} from "@travel-reimbursement/shared";

import { ApiClientError } from "./api";

export interface DevelopmentEmployee extends User {
  department: string;
}

export interface DevelopmentPriceRevision {
  id: string;
  department: string;
  previousPrice: number;
  newPrice: number;
  reason: string;
  updatedAt: string;
}

export interface DevelopmentAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface DevelopmentRequest extends TravelRequest {
  originCity: string;
  notes: string;
  employee: DevelopmentEmployee;
  revisions: DevelopmentPriceRevision[];
  attachments: DevelopmentAttachment[];
}

export interface CreateDevelopmentRequestInput {
  employeeId: string;
  originCity: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  transportationCost?: number;
  notes?: string;
  attachments?: DevelopmentAttachment[];
}

export interface DevelopmentApprovalInput {
  note?: string;
  revisedCost?: number;
  accommodationType?: AccommodationType;
  transportationCost?: number;
  destination?: string;
  method?: string;
  departureAt?: string;
  returnAt?: string;
  meetsSevenHourRule?: boolean;
}

export const developmentEmployees: readonly DevelopmentEmployee[] = [
  { id: "u1", employeeNumber: "DEV001", displayName: "Mariam Hassan (Demo)", jobLevel: "Level 1", roles: ["employee"], department: "Offshore Operations" },
  { id: "u2", employeeNumber: "DEV002", displayName: "Omar Nabil (Demo)", jobLevel: "Level 2", roles: ["employee"], department: "Operations" },
  { id: "u3", employeeNumber: "DEV003", displayName: "Salma Fathy (Demo)", jobLevel: "Level 3", roles: ["employee"], department: "Planning" },
  { id: "u4", employeeNumber: "DEV004", displayName: "Karim Adel (Demo Manager)", jobLevel: "General Manager", roles: ["employee", "manager"], department: "Pipeline Engineering" },
  { id: "u5", employeeNumber: "DEV005", displayName: "Nour Samir (Demo PR)", jobLevel: "Assistant", roles: ["employee", "pr"], department: "Public Relations" },
  { id: "u6", employeeNumber: "DEV006", displayName: "Youssef Amin (Demo Transportation)", jobLevel: "Level 1", roles: ["employee", "transportation"], department: "Transportation" },
  { id: "u7", employeeNumber: "DEV007", displayName: "Dina Hany (Demo Timing)", jobLevel: "Level 2", roles: ["employee", "timing"], department: "Timing" },
  { id: "u8", employeeNumber: "DEV008", displayName: "Tarek Mostafa (Demo Salary)", jobLevel: "General Manager", roles: ["employee", "salary"], department: "Salary" },
  { id: "u9", employeeNumber: "DEV009", displayName: "Heba Magdy (Demo Salary)", jobLevel: "Assistant General Manager", roles: ["employee", "salary"], department: "Salary" },
] as const;

const STAGES: readonly WorkflowStage[] = [
  "manager-review",
  "pr-review",
  "transportation-review",
  "timing-review",
  "salary-finalization",
  "completed",
];

const STAGE_ROLE: Partial<Record<WorkflowStage, SystemRole>> = {
  "manager-review": "manager",
  "pr-review": "pr",
  "transportation-review": "transportation",
  "timing-review": "timing",
  "salary-finalization": "salary",
};

const ROLE_ACTOR: Record<Exclude<SystemRole, "employee">, string> = {
  manager: "u4",
  pr: "u5",
  transportation: "u6",
  timing: "u7",
  salary: "u8",
};

interface SeedInput {
  id: string;
  employeeId: string;
  stage: WorkflowStage;
  originCity?: string;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  transportationCost: number;
  createdAt: string;
  verifiedSameDayHours?: number;
  verifiedReturnDayHours?: number;
  bonusAmount?: number;
  penaltyAmount?: number;
  cancellationReason?: string;
  notes?: string;
  revisions?: DevelopmentPriceRevision[];
  attachments?: DevelopmentAttachment[];
}

function employeeById(employeeId: string): DevelopmentEmployee {
  const employee = developmentEmployees.find((candidate) => candidate.id === employeeId);
  if (!employee) throw new Error(`Unknown development employee: ${employeeId}`);
  return employee;
}

function dateDifferenceInDays(startValue: string, endValue: string): number {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.round((endDay - startDay) / 86_400_000));
}

function calculate(record: Pick<DevelopmentRequest, "employee" | "accommodationType" | "departureAt" | "returnAt" | "verifiedSameDayHours" | "verifiedReturnDayHours" | "transportationCost" | "bonusAmount" | "penaltyAmount">): SalaryCalculationResult {
  const overnightCount = dateDifferenceInDays(record.departureAt, record.returnAt);
  return calculateSalary({
    jobLevel: record.employee.jobLevel,
    accommodationType: record.accommodationType,
    overnightCount,
    isSameDayMission: overnightCount === 0,
    sameDayVerifiedHours: record.verifiedSameDayHours,
    returnDayVerifiedHours: record.verifiedReturnDayHours,
    transportationCost: record.transportationCost,
    bonusAmount: record.bonusAmount,
    penaltyAmount: record.penaltyAmount,
  });
}

function seedAudit(input: SeedInput): AuditEvent[] {
  const events: AuditEvent[] = [{
    id: `${input.id}-event-1`, requestId: input.id, actorId: input.employeeId,
    actorRole: "employee", action: "submit", fromStage: null,
    toStage: "manager-review", changes: { stage: { before: null, after: "manager-review" } },
    note: input.notes ?? null, createdAt: input.createdAt,
  }];

  if (input.stage === "cancelled") {
    events.push({
      id: `${input.id}-event-2`, requestId: input.id, actorId: ROLE_ACTOR.manager,
      actorRole: "manager", action: "reject", fromStage: "manager-review", toStage: "cancelled",
      changes: { stage: { before: "manager-review", after: "cancelled" } },
      note: input.cancellationReason ?? "Request cancelled.", createdAt: input.createdAt,
    });
    return events;
  }

  const targetIndex = STAGES.indexOf(input.stage);
  for (let index = 0; index < targetIndex; index += 1) {
    const fromStage = STAGES[index];
    const toStage = STAGES[index + 1];
    const actorRole = STAGE_ROLE[fromStage];
    if (!actorRole || actorRole === "employee") continue;
    events.push({
      id: `${input.id}-event-${events.length + 1}`,
      requestId: input.id,
      actorId: ROLE_ACTOR[actorRole],
      actorRole,
      action: toStage === "completed" ? "finalize" : "approve",
      fromStage,
      toStage,
      changes: { stage: { before: fromStage, after: toStage } },
      note: `${actorRole} review completed.`,
      createdAt: input.createdAt,
    });
  }
  return events;
}

function buildSeed(input: SeedInput): DevelopmentRequest {
  const employee = employeeById(input.employeeId);
  const auditEvents = seedAudit(input);
  const record: DevelopmentRequest = {
    id: input.id,
    employeeId: input.employeeId,
    employee,
    originCity: input.originCity ?? "Cairo",
    destinationCity: input.destinationCity,
    departureAt: input.departureAt,
    returnAt: input.returnAt,
    accommodationType: input.accommodationType,
    transportationMethod: input.transportationMethod,
    stage: input.stage,
    verifiedDepartureAt: input.stage === "manager-review" ? null : input.departureAt,
    verifiedReturnAt: ["manager-review", "pr-review", "transportation-review"].includes(input.stage) ? null : input.returnAt,
    verifiedSameDayHours: input.verifiedSameDayHours ?? 0,
    verifiedReturnDayHours: input.verifiedReturnDayHours ?? 0,
    transportationCost: input.transportationCost,
    claimedTransportationCost: input.transportationCost,
    bonusAmount: input.bonusAmount ?? 0,
    penaltyAmount: input.penaltyAmount ?? 0,
    salaryPreview: {} as SalaryCalculationResult,
    finalSalary: null,
    cancellationReason: input.cancellationReason ?? null,
    notes: input.notes ?? "Development travel request.",
    createdAt: input.createdAt,
    updatedAt: auditEvents.at(-1)?.createdAt ?? input.createdAt,
    auditEvents,
    revisions: input.revisions ?? [],
    attachments: input.attachments ?? [],
    priceRevisions: [],
  };
  record.salaryPreview = calculate(record);
  record.finalSalary = input.stage === "completed" ? record.salaryPreview : null;
  return record;
}

function initialRecords(): DevelopmentRequest[] {
  return [
    buildSeed({ id: "TR-2026-001", employeeId: "u1", stage: "manager-review", destinationCity: "Alexandria", departureAt: "2026-08-03T06:00:00.000Z", returnAt: "2026-08-05T18:00:00.000Z", accommodationType: "none", transportationMethod: "Company car", transportationCost: 200, createdAt: "2026-07-20T08:00:00.000Z", notes: "Operations coordination meeting." }),
    buildSeed({ id: "TR-2026-002", employeeId: "u2", stage: "pr-review", destinationCity: "Suez", departureAt: "2026-08-10T07:00:00.000Z", returnAt: "2026-08-11T17:00:00.000Z", accommodationType: "room-only", transportationMethod: "Company bus", transportationCost: 150, createdAt: "2026-07-19T08:30:00.000Z" }),
    buildSeed({ id: "TR-2026-003", employeeId: "u3", stage: "transportation-review", destinationCity: "Ismailia", departureAt: "2026-08-12T06:00:00.000Z", returnAt: "2026-08-14T18:00:00.000Z", accommodationType: "room-and-food", transportationMethod: "Train", transportationCost: 220, createdAt: "2026-07-18T07:30:00.000Z", attachments: [{ id: "attachment-TR-2026-003-1", name: "train-ticket-TR-2026-003.txt", mimeType: "text/plain", size: 91, url: "data:text/plain;charset=utf-8,Travel%20request%20TR-2026-003%0ATrain%20ticket%20attachment%20for%20transportation%20review." }] }),
    buildSeed({ id: "TR-2026-004", employeeId: "u1", stage: "timing-review", destinationCity: "Cairo", departureAt: "2026-08-18T07:00:00.000Z", returnAt: "2026-08-18T16:00:00.000Z", accommodationType: "none", transportationMethod: "Personal car", transportationCost: 100, verifiedSameDayHours: 9, createdAt: "2026-07-17T08:00:00.000Z" }),
    buildSeed({ id: "TR-2026-005", employeeId: "u2", stage: "salary-finalization", destinationCity: "Aswan", departureAt: "2026-08-20T06:00:00.000Z", returnAt: "2026-08-22T15:00:00.000Z", accommodationType: "room-only", transportationMethod: "Train", transportationCost: 250, verifiedReturnDayHours: 7, createdAt: "2026-07-16T08:00:00.000Z" }),
    buildSeed({ id: "TR-2026-006", employeeId: "u3", stage: "completed", destinationCity: "Luxor", departureAt: "2026-08-24T06:00:00.000Z", returnAt: "2026-08-26T16:00:00.000Z", accommodationType: "none", transportationMethod: "Train", transportationCost: 200, verifiedReturnDayHours: 8, bonusAmount: 50, penaltyAmount: 10, createdAt: "2026-07-15T08:00:00.000Z" }),
    buildSeed({ id: "TR-2026-007", employeeId: "u1", stage: "cancelled", destinationCity: "Port Said", departureAt: "2026-08-28T06:00:00.000Z", returnAt: "2026-08-29T18:00:00.000Z", accommodationType: "none", transportationMethod: "Company car", transportationCost: 0, cancellationReason: "The mission was withdrawn.", createdAt: "2026-07-14T08:00:00.000Z" }),
    buildSeed({ id: "TR-2026-0841", employeeId: "u1", stage: "salary-finalization", destinationCity: "Hurghada", departureAt: "2026-07-12T06:00:00.000Z", returnAt: "2026-07-16T18:00:00.000Z", accommodationType: "none", transportationMethod: "Company car", transportationCost: 200, verifiedReturnDayHours: 7, createdAt: "2026-07-12T06:00:00.000Z", revisions: [{ id: "revision-0841-transportation", department: "Transportation", previousPrice: 602, newPrice: 802, reason: "Confirmed company-car transportation cost.", updatedAt: "2026-07-18T09:10:00.000Z" }] }),
    buildSeed({ id: "TR-2026-0839", employeeId: "u5", stage: "salary-finalization", destinationCity: "Matrouh", departureAt: "2026-07-10T07:00:00.000Z", returnAt: "2026-07-13T17:00:00.000Z", accommodationType: "room-only", transportationMethod: "Company bus", transportationCost: 150, verifiedReturnDayHours: 8, createdAt: "2026-07-10T07:00:00.000Z", revisions: [{ id: "revision-0839-pr", department: "PR", previousPrice: 942, newPrice: 762, reason: "Room-only accommodation confirmed.", updatedAt: "2026-07-18T11:30:00.000Z" }] }),
    buildSeed({ id: "TR-2026-0836", employeeId: "u4", stage: "salary-finalization", destinationCity: "El-Arish", departureAt: "2026-07-08T08:00:00.000Z", returnAt: "2026-07-10T16:00:00.000Z", accommodationType: "room-and-food", transportationMethod: "Company bus", transportationCost: 100, verifiedReturnDayHours: 4, createdAt: "2026-07-08T08:00:00.000Z" }),
  ];
}

let records = initialRecords();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function recordById(id: string): DevelopmentRequest {
  const record = records.find((candidate) => candidate.id === id);
  if (!record) throw new ApiClientError(404, "REQUEST_NOT_FOUND", "Travel request not found.");
  return record;
}

function validateDates(departureAt: string, returnAt: string): void {
  const departure = new Date(departureAt).getTime();
  const arrival = new Date(returnAt).getTime();
  if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival <= departure) {
    throw new ApiClientError(400, "INVALID_TRAVEL_DATES", "Return time must be after departure time.");
  }
}

function updateCalculation(record: DevelopmentRequest): void {
  record.salaryPreview = calculate(record);
  record.updatedAt = new Date().toISOString();
}

function pushAudit(record: DevelopmentRequest, event: Omit<AuditEvent, "id" | "requestId" | "createdAt">): void {
  const createdAt = new Date().toISOString();
  record.auditEvents.push({ ...event, id: `${record.id}-event-${record.auditEvents.length + 1}`, requestId: record.id, createdAt });
  record.updatedAt = createdAt;
}

export const developmentRepository = {
  async listForEmployee(employeeId: string): Promise<DevelopmentRequest[]> {
    return clone(records.filter((record) => record.employeeId === employeeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async listAll(): Promise<DevelopmentRequest[]> {
    return clone(records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  },

  async get(id: string): Promise<DevelopmentRequest> {
    return clone(recordById(id));
  },

  async create(input: CreateDevelopmentRequestInput): Promise<DevelopmentRequest> {
    validateDates(input.departureAt, input.returnAt);
    if (input.originCity.trim().toLowerCase() === input.destinationCity.trim().toLowerCase()) {
      throw new ApiClientError(409, "CONFLICT", "Origin and destination must be different.");
    }
    const sequence = Math.max(...records.map((record) => Number(record.id.split("-").at(-1)) || 0)) + 1;
    const id = `TR-2026-${String(sequence).padStart(4, "0")}`;
    const record = buildSeed({
      ...input,
      id,
      stage: "manager-review",
      transportationCost: input.transportationCost ?? 0,
      createdAt: new Date().toISOString(),
    });
    records.unshift(record);
    return clone(record);
  },

  async queueForRole(role: SystemRole): Promise<DevelopmentRequest[]> {
    return clone(records.filter((record) => STAGE_ROLE[record.stage] === role));
  },

  async approve(id: string, role: SystemRole, input: DevelopmentApprovalInput): Promise<DevelopmentRequest> {
    const record = recordById(id);
    const requiredRole = STAGE_ROLE[record.stage];
    if (!requiredRole || role !== requiredRole || role === "salary" || role === "employee") {
      throw new ApiClientError(409, "INVALID_TRANSITION", "This request is not in your department queue.");
    }
    const fromStage = record.stage;
    const stageIndex = STAGES.indexOf(fromStage);
    const toStage = STAGES[stageIndex + 1];
    const previousPrice = record.salaryPreview.totalAmount;

    if (input.destination?.trim()) record.destinationCity = input.destination.trim();
    if (input.method?.trim()) record.transportationMethod = input.method.trim();
    if (input.accommodationType) record.accommodationType = input.accommodationType;
    if (typeof input.transportationCost === "number") {
      if (!Number.isFinite(input.transportationCost) || input.transportationCost < 0) throw new ApiClientError(400, "INVALID_PRICE", "Transportation cost must be non-negative.");
      record.transportationCost = input.transportationCost;
    } else if (typeof input.revisedCost === "number") {
      if (!Number.isFinite(input.revisedCost) || input.revisedCost < 0) throw new ApiClientError(400, "INVALID_PRICE", "The revised amount must be non-negative.");
      record.transportationCost = Math.max(0, input.revisedCost - (record.salaryPreview.totalAmount - record.transportationCost));
    }
    if (role === "timing") {
      if (input.departureAt) record.verifiedDepartureAt = input.departureAt;
      if (input.returnAt) record.verifiedReturnAt = input.returnAt;
      const days = dateDifferenceInDays(record.verifiedDepartureAt ?? record.departureAt, record.verifiedReturnAt ?? record.returnAt);
      record.verifiedSameDayHours = days === 0 && input.meetsSevenHourRule ? 7 : 0;
      record.verifiedReturnDayHours = days > 0 && input.meetsSevenHourRule ? 7 : 0;
    }
    updateCalculation(record);
    if (record.salaryPreview.totalAmount !== previousPrice) {
      record.revisions.push({ id: `revision-${id}-${role}-${record.revisions.length + 1}`, department: role, previousPrice, newPrice: record.salaryPreview.totalAmount, reason: input.note?.trim() || `${role} review adjustment.`, updatedAt: record.updatedAt });
    }
    record.stage = toStage;
    pushAudit(record, { actorId: ROLE_ACTOR[role], actorRole: role, action: "approve", fromStage, toStage, changes: { stage: { before: fromStage, after: toStage } }, note: input.note?.trim() || null });
    return clone(record);
  },

  async reject(id: string, role: SystemRole, reason: string): Promise<DevelopmentRequest> {
    const record = recordById(id);
    if (!reason.trim()) throw new ApiClientError(400, "REJECTION_REASON_REQUIRED", "A rejection reason is required.");
    if (STAGE_ROLE[record.stage] !== role || role !== "manager") {
      throw new ApiClientError(409, "INVALID_TRANSITION", "This request is not in your department queue.");
    }
    const fromStage = record.stage;
    record.stage = "cancelled";
    record.cancellationReason = reason.trim();
    pushAudit(record, { actorId: ROLE_ACTOR[role], actorRole: role, action: "reject", fromStage, toStage: "cancelled", changes: { stage: { before: fromStage, after: "cancelled" }, cancellationReason: { before: null, after: reason.trim() } }, note: reason.trim() });
    return clone(record);
  },

  async updateSalary(id: string, bonusAmount: number, penaltyAmount: number, note: string): Promise<DevelopmentRequest> {
    const record = recordById(id);
    if (record.stage !== "salary-finalization") throw new ApiClientError(409, "INVALID_TRANSITION", "This request is not awaiting salary finalization.");
    const previousPrice = record.salaryPreview.totalAmount;
    const previousBonus = record.bonusAmount;
    const previousPenalty = record.penaltyAmount;
    record.bonusAmount = bonusAmount;
    record.penaltyAmount = penaltyAmount;
    updateCalculation(record);
    if (previousPrice !== record.salaryPreview.totalAmount) {
      record.revisions.push({ id: `revision-${id}-salary-${record.revisions.length + 1}`, department: "Salary", previousPrice, newPrice: record.salaryPreview.totalAmount, reason: note.trim(), updatedAt: record.updatedAt });
      pushAudit(record, { actorId: ROLE_ACTOR.salary, actorRole: "salary", action: "edit", fromStage: record.stage, toStage: record.stage, changes: { bonusAmount: { before: previousBonus, after: bonusAmount }, penaltyAmount: { before: previousPenalty, after: penaltyAmount } }, note: note.trim() });
    }
    return clone(record);
  },

  async finalizeSalary(id: string, note: string): Promise<DevelopmentRequest> {
    const record = recordById(id);
    if (record.stage !== "salary-finalization") throw new ApiClientError(409, "REQUEST_ALREADY_COMPLETED", "This request is not awaiting salary finalization.");
    record.stage = "completed";
    record.finalSalary = clone(record.salaryPreview);
    pushAudit(record, { actorId: ROLE_ACTOR.salary, actorRole: "salary", action: "finalize", fromStage: "salary-finalization", toStage: "completed", changes: { stage: { before: "salary-finalization", after: "completed" } }, note: note.trim() });
    return clone(record);
  },
};

export function resetDevelopmentRepositoryForTests(): void {
  records = initialRecords();
}
