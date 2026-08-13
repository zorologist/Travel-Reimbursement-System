import type {
  AuditEvent,
  PriceRevision,
  SystemRole,
  TravelRequest,
  User,
  WorkflowStage,
} from "@travel-reimbursement/shared";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import type { StorageInterface } from "./storageTypes.js";

type Queryable = Pick<Pool | PoolClient, "query">;

const ROLE_STAGE: Readonly<Partial<Record<SystemRole, WorkflowStage>>> = {
  manager: "manager-review",
  pr: "pr-review",
  transportation: "transportation-review",
  timing: "timing-review",
  salary: "salary-finalization",
};

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function number(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

function mapUser(row: QueryResultRow): User {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    displayName: row.display_name,
    department: row.department,
    jobLevel: row.job_level,
    roles: row.roles ?? [],
  } as User;
}

function mapAudit(row: QueryResultRow): AuditEvent {
  return {
    id: row.id,
    requestId: row.request_id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    changes: row.changes,
    note: row.note,
    createdAt: iso(row.created_at),
  };
}

function mapRevision(row: QueryResultRow): PriceRevision {
  return {
    id: row.id,
    requestId: row.request_id,
    stage: row.stage,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    previousCalculation: row.previous_calculation,
    newCalculation: row.new_calculation,
    difference: number(row.difference),
    changes: row.changes,
    note: row.note,
    createdAt: iso(row.created_at),
  };
}

function mapRequest(
  row: QueryResultRow,
  auditEvents: AuditEvent[],
  priceRevisions: PriceRevision[],
): TravelRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    managerId: row.manager_id,
    originCity: row.origin_city,
    destinationCity: row.destination_city,
    departureAt: iso(row.departure_at),
    returnAt: iso(row.return_at),
    tripType: row.trip_type,
    accommodationType: row.accommodation_type,
    transportationMethod: row.transportation_method,
    stage: row.stage,
    verifiedDepartureAt: row.verified_departure_at ? iso(row.verified_departure_at) : null,
    verifiedReturnAt: row.verified_return_at ? iso(row.verified_return_at) : null,
    verifiedSameDayHours: number(row.verified_same_day_hours),
    verifiedReturnDayHours: number(row.verified_return_day_hours),
    transportationCost: number(row.transportation_cost),
    transportationCostVerified: row.transportation_cost_verified,
    claimedTransportationCost: number(row.claimed_transportation_cost),
    bonusAmount: number(row.bonus_amount),
    penaltyAmount: number(row.penalty_amount),
    salaryPreview: row.salary_preview,
    finalSalary: row.final_salary,
    cancellationReason: row.cancellation_reason,
    notes: row.notes,
    attachments: row.attachments,
    pendingEmployeeResponse: row.pending_employee_response,
    timeNeedsVerification: row.time_needs_verification,
    submittedRequest: row.submitted_request,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    auditEvents,
    priceRevisions,
  } as TravelRequest;
}

async function hydrateRequests(queryable: Queryable, rows: QueryResultRow[]): Promise<TravelRequest[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id as string);
  const [auditResult, revisionResult] = await Promise.all([
    queryable.query(
      "SELECT * FROM audit_events WHERE request_id = ANY($1::text[]) ORDER BY created_at, id",
      [ids],
    ),
    queryable.query(
      "SELECT * FROM price_revisions WHERE request_id = ANY($1::text[]) ORDER BY created_at, id",
      [ids],
    ),
  ]);
  const audits = new Map<string, AuditEvent[]>();
  for (const row of auditResult.rows) {
    const items = audits.get(row.request_id) ?? [];
    items.push(mapAudit(row));
    audits.set(row.request_id, items);
  }
  const revisions = new Map<string, PriceRevision[]>();
  for (const row of revisionResult.rows) {
    const items = revisions.get(row.request_id) ?? [];
    items.push(mapRevision(row));
    revisions.set(row.request_id, items);
  }
  return rows.map((row) => mapRequest(row, audits.get(row.id) ?? [], revisions.get(row.id) ?? []));
}

const REQUEST_COLUMNS = `
  id, employee_id, manager_id, origin_city, destination_city, departure_at,
  return_at, trip_type, accommodation_type, transportation_method, stage,
  verified_departure_at, verified_return_at, verified_same_day_hours,
  verified_return_day_hours, transportation_cost, transportation_cost_verified,
  claimed_transportation_cost, bonus_amount, penalty_amount, salary_preview,
  final_salary, cancellation_reason, notes, attachments, pending_employee_response,
  time_needs_verification, submitted_request, created_at, updated_at`;

function requestValues(request: TravelRequest): unknown[] {
  return [
    request.id, request.employeeId, request.managerId, request.originCity,
    request.destinationCity, request.departureAt, request.returnAt, request.tripType,
    request.accommodationType, request.transportationMethod, request.stage,
    request.verifiedDepartureAt, request.verifiedReturnAt, request.verifiedSameDayHours,
    request.verifiedReturnDayHours, request.transportationCost,
    request.transportationCostVerified, request.claimedTransportationCost,
    request.bonusAmount, request.penaltyAmount, JSON.stringify(request.salaryPreview),
    request.finalSalary ? JSON.stringify(request.finalSalary) : null,
    request.cancellationReason, request.notes, JSON.stringify(request.attachments),
    request.pendingEmployeeResponse, request.timeNeedsVerification,
    JSON.stringify(request.submittedRequest), request.createdAt, request.updatedAt,
  ];
}

async function insertAudit(queryable: Queryable, event: AuditEvent): Promise<void> {
  await queryable.query(
    `INSERT INTO audit_events
      (id, request_id, actor_id, actor_role, action, from_stage, to_stage, changes, note, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [event.id, event.requestId, event.actorId, event.actorRole, event.action,
      event.fromStage, event.toStage, JSON.stringify(event.changes), event.note, event.createdAt],
  );
}

async function insertRevision(queryable: Queryable, revision: PriceRevision): Promise<void> {
  await queryable.query(
    `INSERT INTO price_revisions
      (id, request_id, stage, actor_id, actor_role, previous_calculation,
       new_calculation, difference, changes, note, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [revision.id, revision.requestId, revision.stage, revision.actorId,
      revision.actorRole, JSON.stringify(revision.previousCalculation),
      JSON.stringify(revision.newCalculation), revision.difference,
      JSON.stringify(revision.changes), revision.note, revision.createdAt],
  );
}

function isAppendOnly<T>(current: readonly T[], next: readonly T[]): boolean {
  return next.length >= current.length
    && current.every((item, index) => JSON.stringify(item) === JSON.stringify(next[index]));
}

export class PostgresStore implements StorageInterface {
  constructor(private readonly pool: Pool) {}

  async listUsers(): Promise<User[]> {
    const result = await this.pool.query(`
      SELECT u.*, COALESCE(array_agg(ur.role ORDER BY ur.role)
        FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.active = true GROUP BY u.id ORDER BY u.display_name`);
    return result.rows.map(mapUser);
  }

  async findUserById(id: string): Promise<User | undefined> {
    const result = await this.pool.query(`
      SELECT u.*, COALESCE(array_agg(ur.role ORDER BY ur.role)
        FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = $1 AND u.active = true GROUP BY u.id`, [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async findUserByEmployeeNumber(employeeNumber: string): Promise<User | undefined> {
    const result = await this.pool.query(`
      SELECT u.*, COALESCE(array_agg(ur.role ORDER BY ur.role)
        FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE upper(u.employee_number) = upper($1) AND u.active = true GROUP BY u.id`,
    [employeeNumber.trim()]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async findUserByDirectoryIdentity(identity: string): Promise<User | undefined> {
    const normalized = identity.trim();
    const accountName = normalized.split("\\").at(-1)?.split("@")[0] ?? normalized;
    const result = await this.pool.query(`
      SELECT u.*, COALESCE(array_agg(ur.role ORDER BY ur.role)
        FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.active = true AND (
        upper(u.windows_username) IN (upper($1), upper($2))
        OR upper(CASE WHEN position('\' in u.windows_username) > 0
            THEN split_part(u.windows_username, '\', 2)
            ELSE u.windows_username
          END) = upper($2)
        OR upper(u.user_principal_name) = upper($1)
      )
      GROUP BY u.id`, [normalized, accountName]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  private async requestQuery(sql: string, values: unknown[] = []): Promise<TravelRequest[]> {
    const result = await this.pool.query(sql, values);
    return hydrateRequests(this.pool, result.rows);
  }

  async listRequests(): Promise<TravelRequest[]> {
    return this.requestQuery("SELECT * FROM travel_requests ORDER BY created_at DESC");
  }

  async listRequestsByOwner(employeeId: string): Promise<TravelRequest[]> {
    return this.requestQuery(
      "SELECT * FROM travel_requests WHERE employee_id = $1 ORDER BY created_at DESC", [employeeId],
    );
  }

  async listRequestsByStage(stage: WorkflowStage): Promise<TravelRequest[]> {
    return this.requestQuery(
      "SELECT * FROM travel_requests WHERE stage = $1 ORDER BY created_at DESC", [stage],
    );
  }

  async listRequestsForRole(role: SystemRole, userId?: string): Promise<TravelRequest[]> {
    if (role === "employee") return [];
    if (role === "manager") {
      if (!userId) return [];
      return this.requestQuery(
        "SELECT * FROM travel_requests WHERE stage = 'manager-review' AND manager_id = $1 ORDER BY created_at DESC",
        [userId],
      );
    }
    const stage = ROLE_STAGE[role];
    return stage ? this.listRequestsByStage(stage) : [];
  }

  async findRequestById(id: string): Promise<TravelRequest | undefined> {
    const records = await this.requestQuery("SELECT * FROM travel_requests WHERE id = $1", [id]);
    return records[0];
  }

  async nextRequestId(now = new Date()): Promise<string> {
    const result = await this.pool.query("SELECT nextval('travel_request_number_seq') AS sequence");
    return `TR-${now.getUTCFullYear()}-${String(result.rows[0].sequence).padStart(4, "0")}`;
  }

  async createRequest(request: TravelRequest): Promise<TravelRequest> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO travel_requests (${REQUEST_COLUMNS})
         VALUES (${requestValues(request).map((_, index) => `$${index + 1}`).join(",")})`,
        requestValues(request),
      );
      for (const event of request.auditEvents) await insertAudit(client, event);
      for (const revision of request.priceRevisions) await insertRevision(client, revision);
      await client.query("COMMIT");
      return structuredClone(request);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRequest(id: string, updates: Partial<TravelRequest>): Promise<TravelRequest | null> {
    const current = await this.findRequestById(id);
    if (!current) return null;
    return this.replaceRequest(id, {
      ...current,
      ...structuredClone(updates),
      id: current.id,
      employeeId: current.employeeId,
      createdAt: current.createdAt,
      submittedRequest: structuredClone(current.submittedRequest),
      updatedAt: updates.updatedAt ?? new Date().toISOString(),
    });
  }

  async replaceRequest(id: string, request: TravelRequest): Promise<TravelRequest | null> {
    if (request.id !== id) throw new Error("Replacement request ID must match the stored request ID.");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query("SELECT * FROM travel_requests WHERE id = $1 FOR UPDATE", [id]);
      if (!locked.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      const current = (await hydrateRequests(client, locked.rows))[0];
      if (["completed", "cancelled"].includes(current.stage)) {
        throw new Error("Completed and cancelled requests are locked.");
      }
      if (!isAppendOnly(current.auditEvents, request.auditEvents)) {
        throw new Error("Audit history is append-only and cannot be changed or removed.");
      }
      if (!isAppendOnly(current.priceRevisions, request.priceRevisions)) {
        throw new Error("Price revision history is append-only and cannot be changed or removed.");
      }
      const values = requestValues(request);
      const assignments = REQUEST_COLUMNS.split(",").map((column) => column.trim()).slice(1)
        .map((column, index) => `${column} = $${index + 2}`).join(", ");
      await client.query(
        `UPDATE travel_requests SET ${assignments}, version = version + 1 WHERE id = $1`,
        [id, ...values.slice(1)],
      );
      for (const event of request.auditEvents.slice(current.auditEvents.length)) await insertAudit(client, event);
      for (const revision of request.priceRevisions.slice(current.priceRevisions.length)) await insertRevision(client, revision);
      await client.query("COMMIT");
      return structuredClone(request);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async addAuditEvent(requestId: string, event: AuditEvent): Promise<TravelRequest | null> {
    if (event.requestId !== requestId) {
      throw new Error("Audit event requestId must match the stored request ID.");
    }
    const request = await this.findRequestById(requestId);
    if (!request) return null;
    return this.replaceRequest(requestId, {
      ...request,
      auditEvents: [...request.auditEvents, structuredClone(event)],
      updatedAt: event.createdAt,
    });
  }
}
