import { calculateSalary } from "@travel-reimbursement/shared";
import type {
  AccommodationType,
  AuditEvent,
  SalaryCalculationResult,
  SystemRole,
  TravelRequest,
  WorkflowAction,
  WorkflowStage,
} from "@travel-reimbursement/shared";
import { developmentUsers } from "./users.js";

const actors = {
  manager: "u4",
  pr: "u5",
  transportation: "u6",
  timing: "u7",
  salary: "u8",
} as const;

interface SeedRequestInput {
  id: string;
  employeeId: string;
  stage: WorkflowStage;
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
  transportationCost: number;
  verifiedDepartureAt?: string | null;
  verifiedReturnAt?: string | null;
  verifiedSameDayHours?: number;
  verifiedReturnDayHours?: number;
  bonusAmount?: number;
  penaltyAmount?: number;
  cancellationReason?: string | null;
  createdAt: string;
  history: AuditEvent[];
}

interface AuditInput {
  requestId: string;
  sequence: number;
  actorId: string;
  actorRole: SystemRole;
  action: WorkflowAction;
  fromStage: WorkflowStage | null;
  toStage: WorkflowStage;
  createdAt: string;
  changes?: AuditEvent["changes"];
  note?: string | null;
}

function audit(input: AuditInput): AuditEvent {
  return {
    id: `${input.requestId}-event-${input.sequence}`,
    requestId: input.requestId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    fromStage: input.fromStage,
    toStage: input.toStage,
    changes: input.changes ?? {},
    note: input.note ?? null,
    createdAt: input.createdAt,
  };
}

function submitted(
  requestId: string,
  employeeId: string,
  createdAt: string,
): AuditEvent {
  return audit({
    requestId,
    sequence: 1,
    actorId: employeeId,
    actorRole: "employee",
    action: "submit",
    fromStage: null,
    toStage: "manager-review",
    createdAt,
    changes: { stage: { before: null, after: "manager-review" } },
  });
}

function stageApproval(
  requestId: string,
  sequence: number,
  actorId: string,
  actorRole: SystemRole,
  fromStage: WorkflowStage,
  toStage: WorkflowStage,
  createdAt: string,
  note: string,
): AuditEvent {
  return audit({
    requestId,
    sequence,
    actorId,
    actorRole,
    action: "approve",
    fromStage,
    toStage,
    createdAt,
    changes: { stage: { before: fromStage, after: toStage } },
    note,
  });
}

function employeeJobLevel(employeeId: string) {
  const user = developmentUsers.find((candidate) => candidate.id === employeeId);
  if (!user) throw new Error(`Unknown development employee: ${employeeId}`);
  return user.jobLevel;
}

function overnightCount(departureAt: string, returnAt: string): number {
  const start = new Date(departureAt);
  const end = new Date(returnAt);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const startDate = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endDate = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  return Math.max(0, Math.round((endDate - startDate) / millisecondsPerDay));
}

function calculationFor(input: SeedRequestInput): SalaryCalculationResult {
  const verifiedDepartureAt = input.verifiedDepartureAt ?? input.departureAt;
  const verifiedReturnAt = input.verifiedReturnAt ?? input.returnAt;
  const isSameDayMission =
    verifiedDepartureAt.slice(0, 10) === verifiedReturnAt.slice(0, 10);

  return calculateSalary({
    jobLevel: employeeJobLevel(input.employeeId),
    accommodationType: input.accommodationType,
    overnightCount: isSameDayMission
      ? 0
      : overnightCount(verifiedDepartureAt, verifiedReturnAt),
    isSameDayMission,
    sameDayVerifiedHours: input.verifiedSameDayHours ?? 0,
    returnDayVerifiedHours: input.verifiedReturnDayHours ?? 0,
    transportationCost: input.transportationCost,
    bonusAmount: input.bonusAmount ?? 0,
    penaltyAmount: input.penaltyAmount ?? 0,
  });
}

function buildRequest(input: SeedRequestInput): TravelRequest {
  const calculation = calculationFor(input);
  const updatedAt = input.history.at(-1)?.createdAt ?? input.createdAt;

  return {
    id: input.id,
    employeeId: input.employeeId,
    stage: input.stage,
    destinationCity: input.destinationCity,
    departureAt: input.departureAt,
    returnAt: input.returnAt,
    accommodationType: input.accommodationType,
    transportationMethod: input.transportationMethod,
    verifiedDepartureAt: input.verifiedDepartureAt ?? null,
    verifiedReturnAt: input.verifiedReturnAt ?? null,
    verifiedSameDayHours: input.verifiedSameDayHours ?? 0,
    verifiedReturnDayHours: input.verifiedReturnDayHours ?? 0,
    transportationCost: input.transportationCost,
    bonusAmount: input.bonusAmount ?? 0,
    penaltyAmount: input.penaltyAmount ?? 0,
    salaryPreview: calculation,
    finalSalary: input.stage === "completed" ? calculation : null,
    cancellationReason: input.cancellationReason ?? null,
    createdAt: input.createdAt,
    updatedAt,
    auditEvents: input.history,
  };
}

function managerReviewRequest(): TravelRequest {
  const id = "TR-2026-001";
  const createdAt = "2026-07-20T08:00:00.000Z";
  return buildRequest({
    id,
    employeeId: "u1",
    stage: "manager-review",
    destinationCity: "Alexandria",
    departureAt: "2026-08-03T06:00:00.000Z",
    returnAt: "2026-08-05T18:00:00.000Z",
    accommodationType: "none",
    transportationMethod: "Company car",
    transportationCost: 200,
    createdAt,
    history: [submitted(id, "u1", createdAt)],
  });
}

function prReviewRequest(): TravelRequest {
  const id = "TR-2026-002";
  const createdAt = "2026-07-19T08:30:00.000Z";
  return buildRequest({
    id,
    employeeId: "u2",
    stage: "pr-review",
    destinationCity: "Suez",
    departureAt: "2026-08-10T07:00:00.000Z",
    returnAt: "2026-08-11T17:00:00.000Z",
    accommodationType: "room-only",
    transportationMethod: "Company bus",
    transportationCost: 150,
    createdAt,
    history: [
      submitted(id, "u2", createdAt),
      stageApproval(
        id, 2, actors.manager, "manager", "manager-review", "pr-review",
        "2026-07-19T10:00:00.000Z", "Business need approved.",
      ),
    ],
  });
}

function transportationReviewRequest(): TravelRequest {
  const id = "TR-2026-003";
  const createdAt = "2026-07-18T07:30:00.000Z";
  return buildRequest({
    id,
    employeeId: "u3",
    stage: "transportation-review",
    destinationCity: "Ismailia",
    departureAt: "2026-08-12T06:00:00.000Z",
    returnAt: "2026-08-14T18:00:00.000Z",
    accommodationType: "room-and-food",
    transportationMethod: "Train",
    transportationCost: 220,
    createdAt,
    history: [
      submitted(id, "u3", createdAt),
      stageApproval(
        id, 2, actors.manager, "manager", "manager-review", "pr-review",
        "2026-07-18T09:00:00.000Z", "Business need approved.",
      ),
      stageApproval(
        id, 3, actors.pr, "pr", "pr-review", "transportation-review",
        "2026-07-18T11:00:00.000Z", "Accommodation confirmed.",
      ),
    ],
  });
}

function timingReviewRequest(): TravelRequest {
  const id = "TR-2026-004";
  const createdAt = "2026-07-17T08:00:00.000Z";
  return buildRequest({
    id,
    employeeId: "u1",
    stage: "timing-review",
    destinationCity: "Cairo",
    departureAt: "2026-08-18T07:00:00.000Z",
    returnAt: "2026-08-18T16:00:00.000Z",
    accommodationType: "none",
    transportationMethod: "Personal car",
    transportationCost: 100,
    createdAt,
    history: [
      submitted(id, "u1", createdAt),
      stageApproval(
        id, 2, actors.manager, "manager", "manager-review", "pr-review",
        "2026-07-17T09:00:00.000Z", "Business need approved.",
      ),
      stageApproval(
        id, 3, actors.pr, "pr", "pr-review", "transportation-review",
        "2026-07-17T10:00:00.000Z", "No accommodation required.",
      ),
      stageApproval(
        id, 4, actors.transportation, "transportation", "transportation-review", "timing-review",
        "2026-07-17T11:00:00.000Z", "Transportation cost confirmed.",
      ),
    ],
  });
}

function salaryFinalizationRequest(): TravelRequest {
  const id = "TR-2026-005";
  const createdAt = "2026-07-16T08:00:00.000Z";
  return buildRequest({
    id,
    employeeId: "u2",
    stage: "salary-finalization",
    destinationCity: "Aswan",
    departureAt: "2026-08-20T06:00:00.000Z",
    returnAt: "2026-08-22T15:00:00.000Z",
    accommodationType: "room-only",
    transportationMethod: "Train",
    transportationCost: 250,
    verifiedDepartureAt: "2026-08-20T06:10:00.000Z",
    verifiedReturnAt: "2026-08-22T15:10:00.000Z",
    verifiedReturnDayHours: 7,
    createdAt,
    history: [
      submitted(id, "u2", createdAt),
      stageApproval(
        id, 2, actors.manager, "manager", "manager-review", "pr-review",
        "2026-07-16T09:00:00.000Z", "Business need approved.",
      ),
      stageApproval(
        id, 3, actors.pr, "pr", "pr-review", "transportation-review",
        "2026-07-16T10:00:00.000Z", "Room-only accommodation confirmed.",
      ),
      stageApproval(
        id, 4, actors.transportation, "transportation", "transportation-review", "timing-review",
        "2026-07-16T11:00:00.000Z", "Train cost confirmed.",
      ),
      audit({
        requestId: id,
        sequence: 5,
        actorId: actors.timing,
        actorRole: "timing",
        action: "edit",
        fromStage: "timing-review",
        toStage: "timing-review",
        createdAt: "2026-07-16T12:00:00.000Z",
        changes: {
          verifiedDepartureAt: { before: null, after: "2026-08-20T06:10:00.000Z" },
          verifiedReturnAt: { before: null, after: "2026-08-22T15:10:00.000Z" },
          verifiedReturnDayHours: { before: 0, after: 7 },
        },
        note: "Attendance times verified.",
      }),
      stageApproval(
        id, 6, actors.timing, "timing", "timing-review", "salary-finalization",
        "2026-07-16T12:05:00.000Z", "Timing verification complete.",
      ),
    ],
  });
}

function completedRequest(): TravelRequest {
  const id = "TR-2026-006";
  const createdAt = "2026-07-15T08:00:00.000Z";
  return buildRequest({
    id,
    employeeId: "u3",
    stage: "completed",
    destinationCity: "Luxor",
    departureAt: "2026-08-24T06:00:00.000Z",
    returnAt: "2026-08-26T16:00:00.000Z",
    accommodationType: "none",
    transportationMethod: "Train",
    transportationCost: 200,
    verifiedDepartureAt: "2026-08-24T06:00:00.000Z",
    verifiedReturnAt: "2026-08-26T16:00:00.000Z",
    verifiedReturnDayHours: 8,
    bonusAmount: 50,
    penaltyAmount: 10,
    createdAt,
    history: [
      submitted(id, "u3", createdAt),
      stageApproval(
        id, 2, actors.manager, "manager", "manager-review", "pr-review",
        "2026-07-15T09:00:00.000Z", "Business need approved.",
      ),
      stageApproval(
        id, 3, actors.pr, "pr", "pr-review", "transportation-review",
        "2026-07-15T10:00:00.000Z", "Employee-arranged accommodation confirmed.",
      ),
      stageApproval(
        id, 4, actors.transportation, "transportation", "transportation-review", "timing-review",
        "2026-07-15T11:00:00.000Z", "Train cost confirmed.",
      ),
      audit({
        requestId: id,
        sequence: 5,
        actorId: actors.timing,
        actorRole: "timing",
        action: "edit",
        fromStage: "timing-review",
        toStage: "timing-review",
        createdAt: "2026-07-15T12:00:00.000Z",
        changes: {
          verifiedDepartureAt: { before: null, after: "2026-08-24T06:00:00.000Z" },
          verifiedReturnAt: { before: null, after: "2026-08-26T16:00:00.000Z" },
          verifiedReturnDayHours: { before: 0, after: 8 },
        },
      }),
      stageApproval(
        id, 6, actors.timing, "timing", "timing-review", "salary-finalization",
        "2026-07-15T12:05:00.000Z", "Timing verification complete.",
      ),
      audit({
        requestId: id,
        sequence: 7,
        actorId: actors.salary,
        actorRole: "salary",
        action: "edit",
        fromStage: "salary-finalization",
        toStage: "salary-finalization",
        createdAt: "2026-07-15T13:00:00.000Z",
        changes: {
          bonusAmount: { before: 0, after: 50 },
          penaltyAmount: { before: 0, after: 10 },
        },
        note: "Demo adjustment for testing.",
      }),
      audit({
        requestId: id,
        sequence: 8,
        actorId: actors.salary,
        actorRole: "salary",
        action: "finalize",
        fromStage: "salary-finalization",
        toStage: "completed",
        createdAt: "2026-07-15T13:05:00.000Z",
        changes: { stage: { before: "salary-finalization", after: "completed" } },
        note: "Payment finalized for development testing.",
      }),
    ],
  });
}

function cancelledRequest(): TravelRequest {
  const id = "TR-2026-007";
  const createdAt = "2026-07-14T08:00:00.000Z";
  const cancellationReason = "Demo request cancelled because the mission was withdrawn.";
  return buildRequest({
    id,
    employeeId: "u1",
    stage: "cancelled",
    destinationCity: "Port Said",
    departureAt: "2026-08-28T06:00:00.000Z",
    returnAt: "2026-08-29T18:00:00.000Z",
    accommodationType: "none",
    transportationMethod: "Company car",
    transportationCost: 0,
    cancellationReason,
    createdAt,
    history: [
      submitted(id, "u1", createdAt),
      audit({
        requestId: id,
        sequence: 2,
        actorId: actors.manager,
        actorRole: "manager",
        action: "reject",
        fromStage: "manager-review",
        toStage: "cancelled",
        createdAt: "2026-07-14T09:00:00.000Z",
        changes: {
          stage: { before: "manager-review", after: "cancelled" },
          cancellationReason: { before: null, after: cancellationReason },
        },
        note: cancellationReason,
      }),
    ],
  });
}

/** Creates fresh nested records so tests never share mutated audit arrays. */
export function createDevelopmentRequests(): TravelRequest[] {
  return [
    managerReviewRequest(),
    prReviewRequest(),
    transportationReviewRequest(),
    timingReviewRequest(),
    salaryFinalizationRequest(),
    completedRequest(),
    cancelledRequest(),
  ];
}

/** Read-only seed snapshot for documentation and fixture validation. */
export const developmentRequests: readonly TravelRequest[] = createDevelopmentRequests();
