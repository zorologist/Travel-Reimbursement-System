# Backend Remaining Work

Updated: 18 July 2026

This is the current backend handoff. The backend builds and the dummy database works, but only `GET /api/health` is currently exposed. Empty placeholder files compile successfully; that does not mean their features are implemented.

## Confirmed Rules

- Every account is an employee and may submit personal travel requests.
- Manager, PR, Transportation, Timing, and Salary are additional roles.
- Administrators may process their own requests when they reach their department.
- Employees see no prices while a request is in progress.
- Employees see the confirmed final price only after Salary finalizes.
- Administrators working in their department queue see the initial system calculation and all price changes made by earlier departments.
- Each department sees the price entering its stage and the price after its changes.
- Only Manager may reject. Rejection cancels and locks the request.
- Salary finalization saves the official calculation and locks the request.

```text
Submit → Manager → PR → Transportation → Timing → Salary → Completed
              └── reject → Cancelled
```

## Current Status

| Area | Status |
| --- | --- |
| Express server and health | Partial: health only |
| Dummy users and requests | Implemented |
| Typed/resettable memory store | Implemented |
| Storage tests | 10 passing |
| Shared salary calculator | Implemented; 41 tests passing directly |
| Workflow domain service | Partial; needs corrections |
| Authentication | Missing |
| Request API | Missing |
| Workflow API | Missing |
| Salary orchestration | Missing |
| Price revision history | Missing |
| Role-specific response privacy | Missing |
| API journey tests | Missing |

## Person 1 — Authentication and API Foundation

### Files

```text
backend/src/app.ts
backend/src/routes/authRoutes.ts
backend/src/services/authService.ts
backend/src/data/developmentCredentials.ts
backend/src/middleware/authenticate.ts
backend/src/middleware/authorizeRole.ts
backend/src/middleware/errorHandler.ts
backend/src/middleware/notFound.ts
backend/src/validation/authSchemas.ts
backend/src/types/express.d.ts
shared/types/Auth.ts
shared/types/Api.ts
shared/schemas/AuthSchema.ts
```

### Tasks

- Implement development credentials for the stable `DEV001`–`DEV009` users.
- Implement `POST /api/auth/login`, `GET /api/auth/me`, and logout.
- Produce a trusted current user from the backend session/token.
- Never accept the actor ID or role from the request body.
- Register auth, request, and workflow routers in `app.ts`.
- Add JSON 404 and consistent error responses.
- Map validation to `400`, missing auth to `401`, forbidden to `403`, missing records to `404`, stale workflow actions to `409`, and unexpected failures to safe `500` responses.
- Add authentication, health, 404, and error tests.

### Done When

Every dummy account can sign in, `/api/auth/me` restores identity, and protected endpoints reject missing or invalid authentication.

## Person 2 — Request Lifecycle and Visibility

### Files

```text
backend/src/routes/requestRoutes.ts
backend/src/services/requestService.ts
backend/src/validation/requestSchemas.ts
shared/types/TravelRequest.ts
shared/schemas/TravelRequestSchema.ts
```

### Endpoints

```text
GET   /api/requests?scope=mine
GET   /api/requests?scope=queue
POST  /api/requests
GET   /api/requests/:id
PATCH /api/requests/:id
```

### Tasks

- Validate and create personal travel requests.
- Generate ID, owner, stage, timestamps, initial calculation, and submit audit on the backend.
- List the signed-in user's personal requests.
- List the signed-in administrator's current department queue.
- Return authorized request details.
- Implement permitted employee correction.
- Validate destination, accommodation, transportation method, and date ordering.
- Reject or ignore browser-controlled ownership, stage, price, and audit fields.
- Add request service and Supertest coverage.

### Response Privacy

| Viewer | Financial data returned |
| --- | --- |
| Owner before completion | None |
| Owner after cancellation | None; cancellation reason only |
| Owner after completion | Final confirmed salary |
| Administrator in department queue | Current calculation and earlier revisions |
| Transportation reviewer | Also sees/edits transportation cost |
| Salary reviewer | Full calculation, bonus, penalty, and revision history |

Do not return a raw stored `TravelRequest` to every role. Create authorized response views so hiding prices is enforced by the backend, not CSS.

### Done When

Any authenticated staff member can submit and retrieve a personal request, department queues are correctly filtered, and employees cannot obtain intermediate prices from API responses.

## Person 3 — Workflow, Salary, and Price History

### Files

```text
backend/src/routes/workflowRoutes.ts
backend/src/services/workflowService.ts
backend/src/services/salaryService.ts
backend/src/validation/workflowSchemas.ts
shared/types/PriceRevision.ts
shared/schemas/PriceRevisionSchema.ts
shared/schemas/RequestActionSchema.ts
```

### Endpoints

```text
PATCH /api/requests/:id/review
POST  /api/requests/:id/approve
POST  /api/requests/:id/reject
POST  /api/requests/:id/finalize
```

### Existing Workflow Corrections

- Allow Transportation to edit `destinationCity`, method, and cost.
- Remove direct editing of `finalSalary` by Salary.
- Require and store Manager cancellation reason.
- Do not create audit events for empty edits.
- Validate edited and verified dates/hours.
- Remove redundant Salary approval; Salary adjusts and finalizes.
- Finalization must calculate and store a non-null `finalSalary`.
- Keep completed and cancelled records read-only.
- Do not add a self-processing restriction; self-processing is allowed.

### Salary Orchestration

Build calculation input only from trusted stored data:

- Stored employee job level.
- Accommodation selected/verified by PR.
- Destination, method, and cost verified by Transportation.
- Dates and hours verified by Timing.
- Bonus and penalty entered by Salary.

Recalculate after submission and every price-affecting department edit. Never accept the official total from the browser.

### Price Revisions

Record a revision for every financial change:

```text
stage, actor, timestamp
calculation before
calculation after
total difference
changed fields and note
```

The initial system calculation is hidden from the employee but visible to administrators. Later departments see all earlier revisions. Salary finalization records the final revision.

### Done When

Every valid stage action works through HTTP, invalid roles/stages fail, every edit is audited, every financial edit records before/after values, and finalization saves and locks the official amount.

## Person 4 — Storage and Development Data

### Files

```text
backend/src/storage/memoryStore.ts
backend/src/storage/storageTypes.ts
backend/src/storage/memoryStore.test.ts
backend/src/data/company.ts
backend/src/data/users.ts
backend/src/data/requests.ts
```

### Already Implemented

- Nine fictional users, including two Salary users.
- Administrators also have the employee role.
- Seven requests covering all workflow stages/outcomes.
- Correct example calculations and audit histories.
- Mutation-safe reads, duplicate-ID protection, append-only audits, and deterministic reset.

### Remaining Tasks

- Define the formal storage interface in `storageTypes.ts`.
- Add personal-owner and stage/role filtering operations.
- Add atomic persistence for request changes, audit events, and price revisions.
- Store/retrieve price revisions after Person 3 defines the shared contract.
- Support credential lookup required by Person 1.
- Add fixture cases required by full API tests.

## Integration Tests Required

1. Employee submits and sees no price.
2. Manager sees initial system price and approves.
3. PR sees before/after accommodation price and approves.
4. Transportation sees earlier changes, changes cost, and approves.
5. Timing sees earlier changes, verifies hours, and approves.
6. Salary sees the full history, adjusts, and finalizes.
7. Employee now sees only the confirmed final price.
8. Manager rejection stores a reason and locks the request.
9. Wrong roles, skipped stages, and terminal edits fail.
10. An administrator can process their own request.
11. Browser-supplied actor, stage, and official total are rejected/ignored.

## Recommended Merge Order

```text
1. Person 1: authentication, errors, router registration
2. Person 4: storage interface, filtering, price-revision persistence
3. Person 2: request creation, visibility, authorized responses
4. Person 3: workflow routes, salary orchestration, revisions
5. Integration owner: complete API journeys
```

## Backend Definition of Done

- All routes are registered and authenticated appropriately.
- Every input is runtime-validated.
- Employees cannot access intermediate financial data.
- Administrators see previous price revisions in department context.
- Departments edit only their assigned information.
- Workflow cannot skip or move backward.
- Manager is the only rejecting role.
- Salary finalization stores and locks the official breakdown.
- Audit and price histories are append-only.
- Unit, API, and full-journey tests pass.
- Type-check, tests, and production build pass from the repository root.
