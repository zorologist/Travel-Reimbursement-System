<!-- This guide tells the frontend developer exactly what to build, in what order, and which contracts and backend endpoints it depends on. -->

# Frontend Developer Guide

The frontend is the React interface used by employees and approval departments. It collects travel-request information, displays workflow progress, sends permitted actions to the backend, and explains salary calculations and audit history.

The frontend does not decide permissions, workflow transitions, or final payments. It presents available actions and previews, while the backend verifies every action and returns the official result.

Read the root [README](../README.md) first for the full project and business rules. Read [shared/README.md](../shared/README.md) before implementing forms, workflow displays, or salary previews.

## Technology

- **Language:** TypeScript
- **Interface:** React
- **Build tool:** Vite
- **Routing:** React Router
- **Forms:** React Hook Form
- **Validation:** Zod shared schemas
- **Testing:** Vitest and React Testing Library
- **Communication:** JSON over HTTP through `src/services/api.ts`

## Frontend Responsibilities

The frontend must:

- Provide development sign-in until company authentication exists.
- Display navigation appropriate to the signed-in user's roles.
- Allow employees to submit valid travel requests.
- Allow employees to see their requests and current stages.
- Show department users the requests awaiting their action.
- Display only the fields each department is allowed to edit.
- Show salary previews and official calculation breakdowns.
- Show the audit history and before/after changes.
- Handle loading, empty, validation, permission, and server-error states.
- Remain usable with a keyboard and assistive technology.

The frontend must never:

- Trust a role supplied by a form or URL.
- Decide that a workflow action is authorized.
- Send an employee-selected final salary amount.
- Silently change a request after it is completed or cancelled.
- Repeat salary rates, workflow stages, or shared contracts locally.
- Call `fetch` directly from page or component files.

## Current Status

The frontend currently contains a minimal React/Vite startup and placeholder feature files with explanatory comments. Pages, routing, state, API functions, styling, validation, and tests still need implementation.

Shared-package import wiring must be configured before importing code from `shared/`.

## Structure and File Ownership

```text
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── requests/
│   │   │   ├── RequestForm.tsx
│   │   │   ├── RequestTracker.tsx
│   │   │   └── AuditTrail.tsx
│   │   └── workflow/
│   │       └── ApprovalQueue.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MyRequestsPage.tsx
│   │   └── RequestDetailsPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Application files

| File | What belongs here | Why it exists |
| --- | --- | --- |
| `src/main.tsx` | React mounting and global style import | Keeps browser startup separate from application behavior |
| `src/App.tsx` | Router, providers, layout selection, and protected routes | Gives the application one composition root |
| `src/services/api.ts` | Base URL, JSON parsing, authentication headers, and normalized errors | Prevents inconsistent HTTP handling throughout the interface |

### Layout components

| File | What belongs here | Depends on |
| --- | --- | --- |
| `Header.tsx` | App title, current user, active role, and sign-out action | Authentication state |
| `Sidebar.tsx` | Role-aware navigation links | Shared roles and current user |

### Request components

| File | What belongs here | Depends on |
| --- | --- | --- |
| `RequestForm.tsx` | Destination, dates, accommodation, transportation method, validation, and preview | Shared schemas, calculator, request API |
| `RequestTracker.tsx` | Ordered stages, current stage, completed stages, cancelled/completed state | Shared workflow contract |
| `AuditTrail.tsx` | Actor, action, date, stage change, note, and before/after values | Shared audit-event contract |

### Workflow component

`ApprovalQueue.tsx` is one reusable queue for Manager, PR, Transportation, Timing, and Salary users. Do not create five duplicated queue components.

It should receive or retrieve:

- Current user and active role
- Requests awaiting that role
- Columns appropriate to the department
- Permitted edit fields
- Permitted action buttons
- Loading, empty, and error state

The backend response remains authoritative. Hiding an action is useful interface behavior but is not security.

### Pages

| File | What belongs here | Main dependencies |
| --- | --- | --- |
| `LoginPage.tsx` | Development-user selection and sign-in feedback | Authentication API |
| `DashboardPage.tsx` | Role-specific summary and shortcuts | Current user and request counts |
| `MyRequestsPage.tsx` | Employee request list, filters, and new-request entry | Request API |
| `RequestDetailsPage.tsx` | Request fields, tracker, salary breakdown, department actions, and audit history | Request/workflow APIs and shared components |

Pages coordinate data. Reusable display and form behavior belongs in components.

## Recommended Additional Folders

Create these only when their first real use exists:

```text
frontend/src/
├── auth/
│   ├── AuthProvider.tsx
│   ├── ProtectedRoute.tsx
│   └── useAuth.ts
├── services/
│   ├── authApi.ts
│   ├── requestApi.ts
│   └── workflowApi.ts
├── styles/
│   └── global.css
└── test/
    └── setup.ts
```

Do not create empty abstraction folders without a clear responsibility.

## Required Routes

| Frontend path | Who uses it | Page |
| --- | --- | --- |
| `/login` | Everyone not signed in | `LoginPage` |
| `/` | Signed-in users | `DashboardPage` |
| `/requests` | Employees | `MyRequestsPage` |
| `/requests/new` | Employees | Page or `RequestForm` wrapper |
| `/requests/:id` | Authorized users | `RequestDetailsPage` |
| `/approvals` | Approval departments | Page containing `ApprovalQueue` |

Protected routes should verify that a user is signed in. Role-aware pages should show a clear forbidden state when the current user lacks the required role.

## Backend API Dependencies

The frontend needs these backend capabilities in this order:

| Frontend feature | Required backend endpoint |
| --- | --- |
| Development sign-in | `POST /api/auth/login` |
| Restore current session | `GET /api/auth/me` |
| Request list and queues | `GET /api/requests` with role-aware filtering |
| Request submission | `POST /api/requests` |
| Details, tracker, calculation, audit | `GET /api/requests/:id` |
| Employee correction | `PATCH /api/requests/:id` |
| Department edits | `PATCH /api/requests/:id/review` |
| Approval | `POST /api/requests/:id/approve` |
| Manager cancellation | `POST /api/requests/:id/reject` |
| Salary finalization | `POST /api/requests/:id/finalize` |

The frontend may use local example responses while an endpoint is unfinished, but examples must match shared contracts exactly and be removed when integration is complete.

## API Client Rules

`src/services/api.ts` must centralize:

- `VITE_API_URL`
- JSON request and response handling
- Authentication/session information
- Network errors
- Backend error payloads
- `204 No Content` handling

Feature-specific files such as `requestApi.ts` should call the central API helper. Components and pages should call feature API functions, not raw URLs.

The interface should distinguish:

- Field validation errors
- Not signed in
- Signed in but forbidden
- Request not found
- Workflow action no longer allowed
- Network/server failure

## Screen Behavior by Role

### Employee

- Submit a request.
- See a live salary preview clearly labelled as a preview.
- View personal requests and stages.
- View Manager cancellation reason.
- View completed salary breakdown and audit trail.

### Manager

- See only requests awaiting Manager review.
- Approve or reject.
- Provide a required rejection reason.
- Do not edit accommodation, transport, timing, or salary fields.

### PR

- See only requests awaiting PR review.
- Compare submitted accommodation with verified information.
- Edit accommodation and approve.
- See the recalculated preview.
- Do not see a reject action.

### Transportation

- See only requests awaiting Transportation review.
- Edit destination city, method, and temporary price.
- Approve.
- Do not see a reject action.

### Timing

- See only requests awaiting Timing review.
- Enter verified departure/return information and hours.
- Clearly display whether the seven-hour boundary qualifies.
- Approve.
- Do not see a reject action.

### Salary administrator

- Review the full request and audit trail.
- See submitted, edited, and verified values.
- Enter fixed EGP bonus and penalty amounts.
- See the final calculation before confirmation.
- Finalize and lock the request.
- Do not see a reject action.

## Salary Preview and Breakdown

Use the shared pure calculator for the frontend preview. The backend returns the official result.

Display separate lines for:

- Daily rate
- Number of nights
- Accommodation factor/deduction
- Overnight amount
- Same-day amount
- Return-day amount
- Transportation cost
- Bonus
- Penalty
- Total

Never display only an unexplained total. Users and Salary staff must be able to understand the calculation.

Exactly seven verified hours qualifies. Accommodation does not reduce the return-day amount. A request cannot receive both same-day and overnight allowance.

## Implementation Order

### 1. Foundation

- Configure imports from `shared`.
- Add router and application providers.
- Implement the central API client.
- Add global accessible styles.
- Add test setup.

### 2. Authentication and layout

- Implement development sign-in.
- Store and restore the current session.
- Implement protected routes.
- Build Header and Sidebar.
- Filter navigation using shared roles.

### 3. Employee request flow

- Build and validate `RequestForm`.
- Display the shared salary preview.
- Connect submission.
- Build request list and details.
- Build the stage tracker.

### 4. Approval workflow

- Build the reusable `ApprovalQueue`.
- Add role-specific columns and edit controls.
- Connect edit, approve, reject, and finalize APIs.
- Refresh data after successful actions.
- Handle stale/out-of-order action errors.

### 5. Audit and final salary

- Build the audit trail.
- Display before/after values.
- Display official salary breakdown.
- Make completed and cancelled requests read-only.

### 6. Quality

- Add component and page tests.
- Test all roles and states.
- Test keyboard operation and clear labels.
- Test API failures and validation messages.
- Run type checking, tests, and production build.

## Required Testing

- Login success and failure
- Session restoration and sign-out
- Protected and forbidden routes
- Request form validation
- Exactly seven-hour behavior
- Salary preview breakdown
- Request list loading, empty, success, and error states
- Role-specific ApprovalQueue fields/actions
- Manager rejection reason
- No rejection for later departments
- Audit before/after display
- Completed/cancelled read-only state
- Backend validation and authorization errors

## Definition of Done

The frontend development version is ready when:

- Every development role can sign in.
- Role-aware navigation is correct.
- Employees can submit and track requests.
- Every department can perform only its allowed interface actions.
- Salary previews and official totals are clearly distinguished.
- Audit changes are understandable.
- All pages handle loading, empty, validation, forbidden, and error states.
- No shared rule or constant is copied into frontend code.
- Type checking, tests, and production build pass.

## Decisions Still Needed From the Project Owner

The business workflow is sufficiently defined. The frontend still needs these presentation decisions:

1. Should the interface be English, Arabic, or bilingual?
2. If Arabic is included, should the entire layout support right-to-left display?
3. Is there an existing company logo, color palette, or design guide?
4. Should development sign-in use a simple user dropdown, or employee number plus a temporary password?
5. Should the first version prioritize desktop only, or must it support mobile screens immediately?

These choices affect presentation and development sign-in, not the confirmed salary or workflow rules.
