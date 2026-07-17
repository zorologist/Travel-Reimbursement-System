<!-- This is the central source of truth for understanding, building, coordinating, and testing the project. -->

# Travel Reimbursement System

A web application for submitting employee travel requests, moving them through a controlled departmental workflow, calculating travel allowances, and preserving a complete audit trail.

This README is the starting point for everyone working on the project. It explains what the system does, what has and has not been built, how the parts fit together, who depends on whom, and the order in which the work should be completed.

## Start Here

The most important facts are:

- The project uses **React, Express, and TypeScript**.
- The frontend and backend share the same types and calculation rules.
- Development initially uses temporary in-memory information, not a real company database.
- Authentication will eventually use the company Active Directory, but development sign-in comes first.
- The backend is always authoritative for permissions, workflow transitions, and final salary amounts.
- An employee submission is followed by five departments in a fixed order.
- Only the Manager may reject a request. Manager rejection cancels it.
- Later departments may edit their assigned information and approve, but cannot reject.
- Exactly seven verified hours qualifies for same-day and return-day allowance calculations.
- The repository is currently a **scaffold**. Most feature files contain responsibility comments rather than finished implementations.

Do not assume that the presence of a file means its feature has been implemented.

## The Problem This Project Solves

Travel reimbursement is often handled through paper forms, spreadsheets, messages, and manual calculations. That creates several problems:

- Requests can be lost or approved out of order.
- Different departments may work from different versions of the same information.
- Accommodation or transportation corrections may not update the allowance.
- Employees may not know where their request currently is.
- Salary staff may not know who changed a value or why.
- Manual calculations may produce inconsistent payments.

This system creates one request record and moves it through a strict workflow. Every department sees the information it needs, every important change is recorded, and the final salary calculation follows one shared set of rules.

## Users of the System

| User | Main responsibility |
| --- | --- |
| Employee | Submit a request and track its progress |
| Manager | Confirm the business need; approve or reject |
| PR | Verify and correct accommodation information |
| Transportation | Verify destination, travel method, and transportation cost |
| Timing | Verify dates and hours against attendance information |
| Salary administrator | Review the audit trail, apply adjustments, and finalize payment |

System permissions and employee job levels are different concepts. A system role controls what a person may do. A job level selects the employee's daily allowance rate.

## Confirmed Workflow

```text
Employee submits
       │
       ▼
Manager review ── reject ──► Cancelled
       │ approve
       ▼
PR verifies or edits accommodation
       │ approve
       ▼
Transportation verifies or edits travel information and cost
       │ approve
       ▼
Timing verifies or edits dates and hours
       │ approve
       ▼
Salary applies bonus or penalty and finalizes
       │
       ▼
Completed and locked
```

Requests cannot skip stages or move backward in the first version.

### Department permissions

| Stage | Role | Permitted actions | Result |
| --- | --- | --- | --- |
| Manager review | Manager | Approve or reject | PR review or cancelled |
| PR review | PR | Edit accommodation and approve | Transportation review |
| Transportation review | Transportation | Edit city, method, cost, and approve | Timing review |
| Timing review | Timing | Edit verified dates/hours and approve | Salary finalization |
| Salary finalization | Salary | Edit bonus/penalty and finalize | Completed |
| Completed | None | Read only | Remains completed |
| Cancelled | None | Read only | Remains cancelled |

Every approval, edit, rejection, and finalization must create an audit event containing the actor, role, time, action, stage transition, and before/after values.

## Confirmed Salary Rules

All monetary values use Egyptian pounds (EGP).

### Daily rates

| Job level | Daily rate |
| --- | ---: |
| Chairman, Deputy, Advisor, Expert | 270 EGP |
| Assistant, Deputy Assistant | 240 EGP |
| General Manager, Assistant General Manager | 200 EGP |
| Level 1 | 140 EGP |
| Level 2 | 110 EGP |
| Level 3 | 60 EGP |

### Accommodation

| Accommodation supplied by company | Employee receives per full night |
| --- | ---: |
| Nothing | 100% of daily rate |
| Room only | 75% of daily rate |
| Room and food | 50% of daily rate |

### Time and day rules

- One night equals one full allowance day.
- Monday to Wednesday means two nights plus one return day.
- A same-day mission with at least seven verified hours receives 50% of the daily rate.
- A return day with at least seven verified hours receives 30% of the daily rate.
- Exactly seven hours qualifies.
- Less than seven verified hours receives no same-day or return-day allowance.
- Accommodation deductions apply to full nights.
- Accommodation deductions do not reduce the 30% return-day amount.
- A request cannot receive both same-day and overnight allowance.

### Adjustments and transportation

- Transportation is separate from the daily allowance.
- Development uses clearly labelled temporary city prices.
- Actual company prices will be configured later.
- The Salary administrator may add a fixed EGP bonus or penalty.
- Calculations use full precision and returned money values are rounded to two decimal places.

### Calculation formula

```text
overnight amount = daily rate × number of nights × accommodation factor
same-day amount = daily rate × 50% when verified hours >= 7, otherwise 0
return-day amount = daily rate × 30% when verified hours >= 7, otherwise 0

total amount = overnight amount
             + same-day amount
             + return-day amount
             + transportation cost
             + bonus
             - penalty
```

Example: Level 1, two nights, room only, and a seven-hour return day:

```text
overnight = 140 × 2 × 0.75 = 210 EGP
return day = 140 × 0.30 = 42 EGP
allowance total = 252 EGP
```

The return-day amount remains 42 EGP because accommodation does not reduce it.

## Architecture

```text
Browser
  │
  ▼
React frontend
  │ JSON over HTTP
  ▼
Express routes
  │
  ▼
Backend services
  │
  ▼
Storage interface
  │
  ├── Development: in-memory records
  └── Later: company database

Frontend ─────┐
              ├── imports shared types, schemas, constants, and calculations
Backend  ─────┘
```

### Responsibility boundaries

- **Frontend:** presentation, forms, navigation, API calls, loading states, and previews.
- **Backend routes:** HTTP input, validation entry points, status codes, and responses.
- **Backend services:** request, workflow, permission, and salary business rules.
- **Storage:** reading and changing records through defined functions.
- **Shared:** platform-independent contracts, validation schemas, constants, and pure calculations.
- **Docs:** confirmed behavior and team coordination.

Routes must not contain business rules. Services must not manipulate Express response objects. Only storage code may directly change stored records. Shared code must not import React, Express, Node-only APIs, or storage.

## Technology

| Area | Technology | Why it is used |
| --- | --- | --- |
| Language | TypeScript | Keeps frontend, backend, and shared contracts consistent |
| Frontend | React | Builds the interactive interface from reusable components |
| Frontend tooling | Vite | Provides fast development and production builds |
| Routing | React Router | Connects URLs to application pages |
| Forms | React Hook Form | Manages form state and submission |
| API | Express | Exposes straightforward JSON endpoints |
| Validation | Zod | Validates runtime input using reusable schemas |
| Development storage | In-memory TypeScript data | Allows development before company infrastructure is ready |
| Testing | Vitest | Tests shared, frontend, and backend TypeScript |
| API testing | Supertest | Tests Express endpoints without a browser |
| Workspace | npm workspaces | Runs frontend and backend from the repository root |

No real database, ORM, Docker setup, or Active Directory package should be added until the company integration requirements are known.

## Repository Structure

```text
Travel-Reimbursement-System/
├── frontend/                    React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          Shared page layout
│   │   │   ├── requests/        Request form, progress, and audit components
│   │   │   └── workflow/        Reusable approval queue
│   │   ├── pages/               Route-level screens
│   │   ├── services/            Browser API access
│   │   ├── App.tsx              Root application composition
│   │   └── main.tsx             Browser entry point
│   ├── package.json             Frontend commands and dependencies
│   ├── tsconfig.json            Frontend TypeScript settings
│   └── vite.config.ts           Vite configuration
│
├── backend/                     Express application
│   ├── src/
│   │   ├── data/                Temporary development records/configuration
│   │   ├── middleware/          Shared request-processing middleware
│   │   ├── routes/              HTTP endpoint definitions
│   │   ├── services/            Business rules
│   │   ├── storage/             Replaceable data-access boundary
│   │   ├── app.ts               Express configuration and route registration
│   │   └── server.ts            HTTP process entry point
│   ├── package.json             Backend commands and dependencies
│   └── tsconfig.json            Backend TypeScript settings
│
├── shared/                      Code used by frontend and backend
│   ├── constants/               Salary and transportation rates
│   ├── salary/                  Pure calculation code and tests
│   ├── schemas/                 Planned Zod runtime validation
│   ├── types/                   Shared TypeScript contracts
│   └── README.md                Shared developer implementation specification
│
├── docs/                        Focused business and development guides
├── BACKEND_TEAM_GUIDE.md        Four-person backend assignment plan
├── README.md                    Central project guide
└── package.json                 Workspace commands
```

Some planned folders listed above, such as `shared/schemas`, will be created during implementation.

## What Goes in Every File

### Frontend

| File | Responsibility | Depends on |
| --- | --- | --- |
| `frontend/src/main.tsx` | Mount React in the browser | `App.tsx` |
| `frontend/src/App.tsx` | Compose providers, layout, and routes | Pages and layout components |
| `frontend/src/pages/LoginPage.tsx` | Development sign-in, later company sign-in | Auth API and shared user contract |
| `frontend/src/pages/DashboardPage.tsx` | Role-specific summaries and starting actions | Auth state and API responses |
| `frontend/src/pages/MyRequestsPage.tsx` | Employee request list | Request API |
| `frontend/src/pages/RequestDetailsPage.tsx` | Full request, workflow, calculation, and audit history | Request/workflow APIs and components |
| `frontend/src/components/layout/Header.tsx` | Global heading and user information | Auth state |
| `frontend/src/components/layout/Sidebar.tsx` | Role-aware navigation | Shared roles and current user |
| `frontend/src/components/requests/RequestForm.tsx` | Create/correct request fields and validation | Shared schemas and request API |
| `frontend/src/components/requests/RequestTracker.tsx` | Display current stage and progress | Shared workflow stages |
| `frontend/src/components/requests/AuditTrail.tsx` | Display who changed what and when | Shared audit-event contract |
| `frontend/src/components/workflow/ApprovalQueue.tsx` | Reusable department queue and permitted actions | Current role and workflow API |
| `frontend/src/services/api.ts` | Central HTTP URL, headers, JSON parsing, and errors | Backend API contract |

### Backend

| File | Responsibility | Depends on |
| --- | --- | --- |
| `backend/src/server.ts` | Start the HTTP process | `app.ts` |
| `backend/src/app.ts` | Configure Express, middleware, and routers | All backend routers and middleware |
| `backend/src/routes/authRoutes.ts` | Development sign-in and current-user endpoints | User type, user data, storage |
| `backend/src/routes/requestRoutes.ts` | Create, list, and retrieve requests | Validation and request service |
| `backend/src/routes/workflowRoutes.ts` | Approve, edit, reject, and finalize endpoints | Workflow service and validation |
| `backend/src/services/requestService.ts` | Request creation, lookup, and correction rules | Shared contracts and storage |
| `backend/src/services/workflowService.ts` | Stage ordering, permissions, and audit actions | Shared workflow and storage |
| `backend/src/services/salaryService.ts` | Authoritative salary orchestration | Shared calculator and storage |
| `backend/src/storage/memoryStore.ts` | Temporary user/request/audit persistence functions | Development data and shared types |
| `backend/src/data/users.ts` | Safe development accounts for every role | Shared user type |
| `backend/src/data/requests.ts` | Example requests at useful stages | Shared request/workflow types |
| `backend/src/data/company.ts` | Temporary non-sensitive company configuration | No business service imports |
| `backend/src/middleware/errorHandler.ts` | Convert errors into consistent safe responses | Express |

### Shared

| File | Responsibility | Used by |
| --- | --- | --- |
| `shared/types/User.ts` | User, system role, and job-level contracts | Authentication, permissions, interface |
| `shared/types/Workflow.ts` | Stages, actions, and audit-event contracts | Workflow service and interface |
| `shared/types/TravelRequest.ts` | Submission and complete request contracts | Routes, services, storage, forms, pages |
| `shared/constants/salaryRates.ts` | One mapping of job levels to daily rates | Salary calculator and interface labels |
| `shared/constants/transportationRates.ts` | Temporary city prices | Transportation verification and calculation |
| `shared/salary/calculateSalary.ts` | Pure calculation and detailed breakdown | Frontend preview and backend final result |
| `shared/salary/calculateSalary.test.ts` | Boundary and business-rule tests | Development and CI |
| `shared/schemas/*` | Runtime validation for untrusted data | Frontend forms and backend endpoints |

The complete shared implementation specification is in [shared/README.md](shared/README.md).

## How Frontend and Backend Work Together

The shared contract comes first. Frontend and backend developers then work in parallel against that contract.

```text
Business rules confirmed
          │
          ▼
Shared types and schemas
          │
     ┌────┴────┐
     ▼         ▼
 Backend     Frontend
 endpoint    screen and
 and logic   API client
     │         │
     └────┬────┘
          ▼
 Integration test
```

For every feature, agree on:

1. Endpoint path and HTTP method
2. Required role
3. Request JSON
4. Successful response JSON
5. Validation errors
6. Permission errors
7. Audit behavior

The frontend may hide an unauthorized action, but the backend must still reject it. Browser code can be changed by a user and cannot enforce security.

## Dependency and Handoff Order

| Work | Must have first | Unblocks |
| --- | --- | --- |
| Shared user roles/job levels | Confirmed business roles | Authentication, navigation, permissions, salary rates |
| Shared workflow contract | Confirmed stage order/actions | Workflow backend, tracker, approval queue |
| Shared request contract | User and workflow contracts | Storage, request API, forms, details page |
| Shared salary calculator | Job levels and confirmed formulas | Salary service and frontend preview |
| Memory storage | Shared contracts | Auth, requests, workflow services |
| Development authentication | Shared user contract and users | All role-specific integration |
| Request API | Request contract and storage | Request form/list/details integration |
| Workflow API | Workflow contract, auth, request storage | Department queue integration |
| Salary finalization | Calculation, workflow, audit storage | Complete end-to-end journey |

The frontend does not have to wait for every backend feature. It may build against agreed example responses, but those examples must exactly match the shared contract.

## Planned API Contract

The final details should be documented before implementation, but this is the expected endpoint layout:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirm the backend is running |
| `POST` | `/api/auth/login` | Sign in as a development user |
| `GET` | `/api/auth/me` | Return the current user |
| `GET` | `/api/requests` | List requests visible to the current user |
| `POST` | `/api/requests` | Submit a travel request |
| `GET` | `/api/requests/:id` | Return one request and its audit trail |
| `PATCH` | `/api/requests/:id` | Correct an editable request |
| `POST` | `/api/requests/:id/approve` | Approve the current stage |
| `POST` | `/api/requests/:id/reject` | Manager cancels a request |
| `PATCH` | `/api/requests/:id/review` | Department edits its permitted fields |
| `POST` | `/api/requests/:id/finalize` | Salary administrator locks the final amount |

The backend should return consistent JSON errors, for example:

```json
{
  "error": {
    "code": "WORKFLOW_ACTION_NOT_ALLOWED",
    "message": "Only the Manager can reject this request.",
    "details": null
  }
}
```

Never return stack traces or internal error details to the frontend.

## Team Ownership

Backend work is divided among four people:

1. API setup and authentication
2. Travel requests
3. Workflow and salary rules
4. Development data, storage, and audit trail

Exact backend ownership, skills, dependencies, and integration order are documented in [BACKEND_TEAM_GUIDE.md](BACKEND_TEAM_GUIDE.md).

One developer should initially own `shared/` because both frontend and backend depend on stable shared contracts. That developer's complete handoff guide is [shared/README.md](shared/README.md).

Frontend work can be divided by feature after the shared contracts exist:

- Application shell, authentication, and navigation
- Employee submission and request pages
- Department approval queue and actions
- Request details, tracking, audit trail, and salary breakdown

## Recommended Implementation Plan

### Phase 1 — Shared contract

- Configure `shared` as an importable workspace package, or add one documented TypeScript/Vite alias used by both applications.
- Add a single shared export entry point so consumers do not rely on fragile relative paths.
- Confirm names and rules.
- Implement user, request, workflow, and audit types.
- Implement Zod schemas.
- Implement salary and temporary transportation constants.
- Implement salary calculation and tests.

Exit condition: frontend and backend agree on all exported contracts and calculation tests pass.

### Phase 2 — Backend foundation

- Implement memory storage through named functions.
- Add safe development users and requests.
- Implement development sign-in and current-user handling.
- Configure route registration and consistent errors.

Exit condition: each development role can sign in and the API returns predictable errors.

### Phase 3 — Request lifecycle

- Implement create, list, detail, and correction operations.
- Validate all incoming data.
- Ensure users only see permitted records.
- Create audit events for submissions and corrections.

Exit condition: an employee can submit and retrieve a valid request through API tests.

### Phase 4 — Department workflow

- Enforce the exact stage transition table.
- Enforce department field ownership.
- Implement Manager cancellation.
- Recalculate after PR, Transportation, or Timing changes.
- Implement Salary adjustments and final locking.

Exit condition: API tests prove stages cannot be skipped and unauthorized actions fail.

### Phase 5 — Frontend

- Implement development login and role-aware navigation.
- Implement request submission, list, tracker, and details.
- Implement one reusable approval queue for all departments.
- Display calculation breakdowns and audit history.
- Handle loading, empty, validation, permission, and server-error states.

Exit condition: each role can complete its allowed part of the workflow through the interface.

### Phase 6 — End-to-end quality

- Test the complete employee-to-Salary journey.
- Test Manager cancellation.
- Test edits and recalculation.
- Test unauthorized and out-of-order actions.
- Run formatting, type checking, unit tests, API tests, and builds in CI.

Exit condition: all confirmed business rules are protected by automated tests.

### Phase 7 — Company integration later

- Confirm Active Directory groups and authentication method.
- Map directory groups to shared system roles.
- Confirm database technology and schema requirements.
- Replace memory storage with a database implementation.
- Replace development users, company information, and transportation prices.
- Preserve service interfaces so the frontend and business logic require minimal changes.

Do not start this phase until the company provides confirmed infrastructure and data requirements.

## Development Setup

### Requirements

- A current Node.js release
- npm

### Install

```bash
npm install
```

### Start frontend and backend

```bash
npm run dev
```

Expected local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

### Quality commands

```bash
npm run typecheck
npm run test
npm run build
```

Dependencies have to be installed before these commands can run.

## Development Standards

### Naming

- Use complete, obvious names.
- Use PascalCase for React components and TypeScript types.
- Use camelCase for functions, variables, and non-component TypeScript files.
- Avoid unexplained abbreviations.
- Use one term consistently; do not alternate between `status` and `stage` for the same concept.

### Backend rules

- Validate all untrusted input.
- Check authorization on every protected endpoint.
- Keep routes thin and business rules in services.
- Access information through storage functions.
- Record audit events for every material action.
- Recalculate official amounts on the backend.
- Prevent changes after cancellation or finalization.

### Frontend rules

- Use `frontend/src/services/api.ts` for HTTP calls.
- Do not call `fetch` directly inside page or component files.
- Use shared schemas for form validation.
- Treat frontend salary calculations as previews only.
- Show clear loading, empty, and error states.
- Build accessible forms, labels, buttons, and status messages.

### Shared rules

- Remain independent of React, Express, storage, and environment configuration.
- Keep calculations pure and deterministic.
- Store constants in one location.
- Keep cross-API values JSON-compatible.
- Add tests for every boundary and business-rule change.

### Git collaboration

- Work mainly in assigned files.
- Keep commits small and focused.
- Do not combine unrelated formatting and feature changes.
- Discuss shared contract changes before merging them.
- Pull/rebase before handing work to another dependent developer.
- Never commit actual employee data, credentials, `.env` files, or company secrets.

## Required Testing

### Shared calculation tests

- Every job level
- Every accommodation option
- Same-day hours below, at, and above seven
- Return-day hours below, at, and above seven
- Overnight counting
- No accommodation reduction on return day
- Transportation remaining separate
- Bonus and penalty behavior
- Invalid negative values
- Two-decimal rounding

### Backend tests

- Valid and invalid sign-in
- Request validation
- Record visibility by role
- Correct stage transitions
- Manager-only rejection
- Department field permissions
- Out-of-order action prevention
- Audit-event creation
- Salary recalculation after edits
- Finalized and cancelled request locking

### Frontend tests

- Form validation
- Role-aware navigation
- Request and approval displays
- Loading and error states
- Workflow action visibility
- Salary breakdown and audit display

### End-to-end journeys

1. Employee submits → all departments approve → Salary finalizes.
2. Employee submits → Manager rejects → request becomes cancelled.
3. PR corrects accommodation → salary preview changes → audit records both values.
4. Timing verifies fewer than seven return hours → return-day amount becomes zero.
5. Unauthorized user attempts an approval → backend rejects the action.

## Development Data and Future Company Systems

The first version intentionally uses temporary in-memory information:

- It is safe for development.
- It resets when the backend restarts.
- It allows every role and stage to be tested.
- It avoids guessing the company's database structure.

The storage layer must expose named operations such as:

```text
findUserById
findRequestById
listRequests
createRequest
updateRequest
addAuditEvent
```

Routes and services call those operations instead of directly changing arrays. Later, a database implementation can provide the same operations.

Active Directory is also deferred. The shared user model uses a role list so future directory groups can map to system permissions without redesigning every feature.

More information is available in [docs/DEVELOPMENT_DATA.md](docs/DEVELOPMENT_DATA.md).

## Security and Audit Expectations

- Never trust employee IDs, roles, prices, or final amounts sent by the browser.
- Derive the acting user from authenticated backend context.
- Verify the role and current workflow stage before every action.
- Allow departments to edit only their assigned fields.
- Store who performed every action and when.
- Store before/after values for edits.
- Never silently overwrite audit history.
- Never expose credentials, tokens, internal errors, or actual company information in development records.

The in-memory version is for development and demonstration. It is not production-ready security or persistence.

## Current Project Status

At the moment:

- The simplified folder structure exists.
- Frontend and backend package files exist.
- Minimal React and Express startup files exist.
- Feature files mainly contain comments describing their future responsibilities.
- The shared implementation specification is documented.
- The four-person backend work division is documented.
- Shared package/import wiring has not been configured yet and must be completed before frontend or backend code imports it.
- Business logic, runtime schemas, storage operations, API routes, interface features, and automated tests still need implementation.
- Dependencies may not yet be installed in a fresh checkout.

This section should be updated as phases are completed so new developers always know what is real and what is planned.

## Documentation Map

| Document | Read it when |
| --- | --- |
| [README.md](README.md) | You are joining the project or need the complete picture |
| [shared/README.md](shared/README.md) | You are implementing shared contracts or calculations |
| [BACKEND_TEAM_GUIDE.md](BACKEND_TEAM_GUIDE.md) | You are assigning or coordinating backend work |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | You need a short workflow reference |
| [docs/SALARY_RULES.md](docs/SALARY_RULES.md) | You need a short salary reference |
| [docs/DEVELOPMENT_DATA.md](docs/DEVELOPMENT_DATA.md) | You are working with temporary data or future storage replacement |

## Definition of Project Completion

The initial development version is complete when:

- Every role can sign in using safe development accounts.
- Employees can submit and track travel requests.
- Requests move through every stage in the correct order.
- Manager rejection cancels and locks a request.
- Later departments can edit only their assigned fields.
- Salary calculations match every confirmed formula and boundary.
- Transportation and Salary adjustments appear separately in the breakdown.
- Every material action appears in an immutable audit trail.
- Completed requests are locked.
- Frontend and backend use shared contracts without copied definitions.
- Type checking, tests, and production builds pass from the repository root.
- No actual employee information, company secrets, or unconfirmed infrastructure assumptions are included.

Build the shared agreement first, implement one complete feature path at a time, and keep the backend authoritative. That is the shortest path to a system the entire team can understand and trust.
