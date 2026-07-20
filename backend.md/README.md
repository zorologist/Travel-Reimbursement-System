<!-- This guide tells backend developers exactly what to build, how responsibilities are separated, and which shared contracts and team members each part depends on. -->

# Backend Developer Guide

The backend is the authoritative Express API for authentication context, travel requests, workflow enforcement, salary calculation, storage, and audit history.

The browser may display permitted actions and salary previews, but the backend must independently verify the user, role, current stage, submitted values, and official amount on every request.

Read the root [README](../README.md) first. Team assignment is documented in [BACKEND_TEAM_GUIDE.md](BACKEND_TEAM_GUIDE.md). Shared contracts and calculations are specified in [the shared guide](../random.md/README.md).

## Technology

- **Language:** TypeScript
- **Runtime:** Node.js
- **HTTP framework:** Express
- **Validation:** Zod shared schemas
- **Development storage:** In-memory TypeScript records
- **Testing:** Vitest and Supertest
- **Transport format:** JSON over HTTP

No real database or Active Directory integration belongs in the first development version.

## Backend Responsibilities

The backend must:

- Establish the current development user.
- Validate all untrusted request data.
- Authorize every protected operation.
- Enforce the exact workflow sequence.
- Restrict each department to its assigned fields.
- Calculate the official salary using shared rules.
- Recalculate after relevant verified changes.
- Record every material action in the audit trail.
- Lock completed and cancelled requests.
- Return consistent status codes and error payloads.
- Hide internal errors and sensitive information.

The backend must not:

- Trust user IDs, roles, prices, stages, or totals supplied by the browser.
- Put business rules directly in route handlers.
- Let services manipulate Express request/response objects.
- Let routes or services directly modify storage arrays.
- Repeat shared types, rates, stages, or salary formulas.
- Add real employee or company information to development files.

## Current Status

Verified: 20 July 2026

| Area | Current state |
| --- | --- |
| Shared dependency | Implemented through the `@travel-reimbursement/shared` workspace and root export |
| Express application | Builds and starts successfully |
| Public API | Health, authentication, requests, department workflow, and Salary endpoints are registered |
| Error handling | Implemented: JSON 404, expected API errors, workflow errors, Zod errors, malformed JSON, and safe 500 responses |
| Development data | Implemented: nine fictional users and seven requests covering all workflow outcomes |
| Memory storage | Implemented with a formal shared-contract interface, filters, append-only audit/revisions, copies, reset, and terminal locking |
| Workflow domain service | Implemented with ordered transitions, field ownership, edits, rejection, audit, and finalization |
| Authentication | HTTP-only development sessions with login, current-user restoration, and logout |
| Request API | Implemented: create, personal list, department queue, authorized detail, and owner correction |
| Workflow API | Department review/approve, Manager reject, and Salary finalize implemented |
| Salary orchestration | Server-authoritative previews, revisions, adjustments, and finalization implemented |
| Price revisions/privacy views | Append-only revisions and role/owner privacy views implemented |
| Verification | Backend type-check/build pass; 46/46 backend tests pass; 45/45 shared tests pass |

The full request lifecycle is available through authenticated HTTP endpoints. The employee-number header remains enabled only outside production for legacy API tests and diagnostic use.

### External integration priorities

1. Replace development sessions with the company's Active Directory adapter.
2. Replace memory storage with the selected durable database and file store.
3. Add deployment-specific TLS, secrets, backups, and monitoring.

`npm audit` currently reports four dependency findings (two moderate, one high, and one critical). They require a separate dependency review; no forced breaking upgrade has been applied.

## Structure

```text
backend/
├── src/
│   ├── data/
│   │   ├── company.ts
│   │   ├── requests.ts
│   │   └── users.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── requestRoutes.ts
│   │   └── workflowRoutes.ts
│   ├── services/
│   │   ├── requestService.ts
│   │   ├── salaryService.ts
│   │   └── workflowService.ts
│   ├── storage/
│   │   └── memoryStore.ts
│   ├── app.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

## Layer Dependency Rule

Dependencies flow inward in one direction:

```text
server.ts
   │
   ▼
app.ts
   │
   ▼
routes + middleware
   │
   ▼
services
   │
   ▼
storage
   │
   ▼
development data

shared contracts/calculations are imported where needed
```

Lower layers never import routes or the Express app. Shared code never imports backend code.

## File Responsibilities

### Startup

| File | What belongs here | Must not contain |
| --- | --- | --- |
| `src/server.ts` | Port selection, starting HTTP server, shutdown handling | Routes or business logic |
| `src/app.ts` | Express instance, JSON/CORS middleware, route registration, not-found and error handlers | Starting the listening process or domain logic |

Keeping `app.ts` separate lets Supertest test the API without opening a real network port.

### Routes

Routes translate HTTP into service calls. They should:

- Read validated parameters and bodies.
- Obtain the current authenticated user.
- Call one appropriate service operation.
- Return the correct status and JSON response.
- Pass errors to centralized middleware.

| File | Endpoints |
| --- | --- |
| `authRoutes.ts` | Development login, current user, and sign-out if the chosen session method needs it |
| `requestRoutes.ts` | Create, list, retrieve, and employee correction |
| `workflowRoutes.ts` | Department edit, approve, Manager reject, and Salary finalize |

### Services

Services own business behavior and should be callable without Express.

| File | Responsibility | Depends on |
| --- | --- | --- |
| `requestService.ts` | Create IDs/timestamps, create/list/find/correct requests, visibility rules | Shared request schemas and storage |
| `workflowService.ts` | Role permissions, current-stage verification, transitions, field restrictions, audit events | Shared workflow contract, salary service, storage |
| `salaryService.ts` | Build verified calculator input, call shared calculator, save preview/final result | Shared calculator and storage |

### Storage

`memoryStore.ts` is the only module that directly changes in-memory records. It should export clear operations:

```text
findUserById
findUserByEmployeeNumber
listUsers
findRequestById
listRequests
createRequest
updateRequest
addAuditEvent
resetStoreForTests
```

Important storage rules:

- Return copies where needed so callers cannot mutate records silently.
- Throw or return a clear not-found result.
- Keep audit events append-only.
- Make related request and audit changes one logical operation.
- Provide deterministic reset behavior for tests.
- Do not expose internal arrays through route responses.

The later company database implementation should provide equivalent operations, allowing services to remain mostly unchanged.

### Development data

| File | Contents |
| --- | --- |
| `data/users.ts` | Safe fictional accounts covering every role and job level |
| `data/requests.ts` | Example requests covering useful workflow stages |
| `data/company.ts` | Temporary non-sensitive company name/settings and development city configuration if not shared |

Development data must be predictable, internally valid, and obviously fictional.

### Middleware

`errorHandler.ts` should normalize known application errors and unexpected errors.

Recommended status codes:

| Situation | Status |
| --- | ---: |
| Successful read/update | 200 |
| Successful creation | 201 |
| Invalid input | 400 |
| Not signed in | 401 |
| Signed in but not permitted | 403 |
| Record not found | 404 |
| Current state conflicts with action | 409 |
| Unexpected failure | 500 |

Recommended error shape:

```json
{
  "error": {
    "code": "WORKFLOW_ACTION_NOT_ALLOWED",
    "message": "Only the Manager can reject this request.",
    "details": null
  }
}
```

Validation details may identify invalid fields. Never send stack traces to the client.

## Authentication Strategy

The company Active Directory mechanism is unknown, so build a replaceable development identity boundary.

The first version needs:

- Development users from `data/users.ts`
- A login operation
- A reliable current-user context for protected endpoints
- A `GET /api/auth/me` endpoint
- Role checks using the shared `roles` array

Do not allow clients to select an arbitrary actor ID on workflow requests. The actor must come from the backend authentication context.

Keep authentication-specific code separate so future Active Directory integration can replace it without rewriting request and workflow services.

## Implemented Endpoints

### Health and authentication

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API status |
| `POST` | `/api/auth/login` | Public | Development user/session |
| `GET` | `/api/auth/me` | Signed in | Current user |

### Requests

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| `GET` | `/api/requests` | Signed in | Role-filtered request list |
| `POST` | `/api/requests` | Employee | New request at Manager review |
| `GET` | `/api/requests/:id` | Authorized viewer | Full request, calculation, and audit |
| `PATCH` | `/api/requests/:id` | Employee when editable | Correct permitted submission fields |

### Workflow

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| `PATCH` | `/api/requests/:id/review` | Current department | Edit department-owned fields and audit changes |
| `POST` | `/api/requests/:id/approve` | Current department | Advance one stage |
| `POST` | `/api/requests/:id/reject` | Manager only | Cancel and lock request |
| `POST` | `/api/requests/:id/finalize` | Salary only | Save final calculation and lock request |

The exact request/response types must come from shared contracts and Zod schemas.

## Workflow Enforcement

The backend must implement this exact table:

| Current stage | Allowed role | Allowed action | Next stage |
| --- | --- | --- | --- |
| Manager review | Manager | Approve | PR review |
| Manager review | Manager | Reject with reason | Cancelled |
| PR review | PR | Edit accommodation, approve | Transportation review |
| Transportation review | Transportation | Edit city/method/cost, approve | Timing review |
| Timing review | Timing | Edit verified dates/hours, approve | Salary finalization |
| Salary finalization | Salary | Edit fixed EGP bonus/penalty, finalize | Completed |

Completed and cancelled are terminal. Later departments cannot reject. No role may skip or manually choose the next stage.

For every action, verify in this order:

1. User is signed in.
2. Request exists and is visible to the user.
3. Request is not terminal.
4. User has the required role.
5. Request is at the required current stage.
6. Submitted fields are valid and allowed for that department.
7. Changes and transition are recorded in an audit event.
8. Salary is recalculated when affected information changes.

## Salary Enforcement

The backend builds calculator input from stored and verified information. It must not accept an official total from the browser.

Recalculate after:

- Request creation for preview
- PR accommodation changes
- Transportation price changes
- Timing date/hour verification
- Salary bonus or penalty changes

Finalize only after Timing approval and Salary confirmation. Save the complete breakdown, not only the total.

The complete formulas and expected numerical tests are in [the shared guide](../random.md/README.md).

## Audit Trail

Create an audit event for:

- Employee submission
- Employee correction, if enabled
- Manager approval or cancellation
- PR edit and approval
- Transportation edit and approval
- Timing edit and approval
- Salary adjustment and finalization

An audit event includes:

- Event ID
- Request ID
- Actor ID and role
- Action
- Previous and next stage
- Before/after values
- Optional note or reason
- ISO 8601 timestamp

Do not update or delete existing audit events. Corrections create new events.

## Implementation Order and Dependencies

### 1. Shared contract dependency

Wait for or coordinate with the shared developer on:

- User roles and job levels
- Travel request input and stored record
- Workflow stages/actions/audit events
- Zod schemas
- Salary rates and calculator

Backend route and service code imports the implemented shared contracts instead of defining local replacements.

### 2. Storage foundation

- Add valid development users and requests.
- Implement memory-store operations.
- Add reset support for tests.
- Test creation, lookup, updates, copies, and append-only audit events.

### 3. Server and authentication

- Configure middleware and routers.
- Implement development identity.
- Implement current-user middleware/context.
- Add normalized errors and not-found handling.

### 4. Request API

- Validate creation input.
- Generate backend-owned fields.
- Enforce visibility.
- Implement list and details.
- Record submission/correction audit events.

### 5. Workflow API

- Implement stage and role checks.
- Implement department-owned edits.
- Implement Manager cancellation.
- Implement approval transitions.
- Recalculate when necessary.

### 6. Salary finalization

- Validate fixed EGP bonus/penalty.
- Return final breakdown for confirmation.
- Finalize and lock atomically.
- Record the final audit event.

### 7. Integration and hardening

- Connect all routers in `app.ts`.
- Add full Supertest journeys.
- Verify no endpoint trusts browser roles or totals.
- Run type checking, tests, and build.

## Who Depends on Whom

| Owner/work | Needs first | Provides to others |
| --- | --- | --- |
| Shared developer | Confirmed business rules | Types, schemas, constants, calculator |
| Storage developer | Shared contracts | User/request/audit operations |
| API/auth developer | User contract and development users | Server and current-user context |
| Request developer | Request schema, auth context, storage | Request endpoints |
| Workflow/salary developer | Auth, request service, storage, shared rules | Approval/finalization endpoints |
| Frontend developers | Shared contracts and endpoint agreement | User interface and integration feedback |

Backend developers should agree on service and storage function signatures early so they can work in parallel without directly editing each other's files.

## Required Tests

### Storage

- Reset behavior
- Creation and lookup
- Not-found behavior
- Updates do not bypass audit behavior
- Returned values cannot mutate internal records silently
- Audit events remain append-only

### Authentication and authorization

- Valid/invalid development login
- Missing identity returns 401
- Wrong role returns 403
- Browser-supplied actor/role is ignored

### Requests

- Valid submission
- Every validation failure
- Backend-generated ID, employee ID, stage, timestamps, and preview
- Visibility by employee and department
- Missing request returns 404

### Workflow

- Every valid transition
- Every out-of-order transition returns 409
- Manager-only rejection
- No later rejection
- Department field restrictions
- Terminal request locking
- Audit event for every action

### Salary

- Every shared calculation case
- Recalculation after each permitted edit
- Browser total ignored
- Bonus/penalty validation
- Final breakdown saved and locked

### Complete API journeys

1. Submit through every approval to completion.
2. Submit and cancel at Manager review.
3. Change accommodation and verify recalculation/audit.
4. Verify a return day below seven hours receives zero return allowance.
5. Attempt unauthorized, skipped, and terminal-state actions.

## Definition of Done

The backend development version is ready when:

- It starts and shuts down cleanly.
- Every development role can establish identity.
- All untrusted input is validated.
- Requests are visible only to appropriate users.
- Workflow order and field ownership are enforced.
- Only the Manager can cancel.
- Official salary results use verified stored information.
- Every material action creates an append-only audit event.
- Completed and cancelled requests are locked.
- Routes contain no business logic and services contain no Express logic.
- Storage can later be replaced without rewriting routes.
- Type checking, unit tests, API tests, and build pass.

## Decisions Still Needed From the Project Owner

The workflow is sufficiently defined. Backend implementation still needs these infrastructure choices:

1. For development sign-in, should identity use a simple user selection, an employee number with a temporary password, or a lightweight development token?
2. Should the temporary session survive a backend restart, or is signing in again acceptable?
3. Do employees see only their own requests while approval departments see all requests at their stage, or should department/location filtering also apply?
4. Should Manager cancellation require a written reason? This guide recommends yes for audit clarity.
5. Should department edits and approval happen in one request, or should users be able to save an edit before approving?

Active Directory protocol, directory groups, real database technology, real city prices, and deployment infrastructure should remain undecided until the company provides them.
