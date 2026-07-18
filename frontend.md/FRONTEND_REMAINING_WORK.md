# Frontend Remaining Work

Updated: 18 July 2026

This is the current frontend handoff. Several screens are visually designed, but most application behavior is not connected to backend APIs yet.

## Confirmed Experience

- Every signed-in account has employee self-service.
- Administrators also receive a separate department workspace.
- Administrators may process their own requests.
- Employees see no prices until Salary finalizes.
- Administrators reviewing a request see the initial system calculation and price changes from departments before them.
- Each department sees its own before/after price comparison.

```text
Signed-in user
├── Employee area: New Request, My Requests, final price after completion
└── Department area when role exists: Queue, revisions, department action
```

## Current Status

| Area | Status |
| --- | --- |
| Login design | Implemented |
| Temporary frontend demo login | Implemented for DEV001 and DEV004 |
| Choice/home page | Implemented |
| New request design | Implemented; not connected to API |
| Dashboard | Assigned to another developer |
| Request details/tracker | Visual prototype; hardcoded data |
| My Requests | Empty placeholder |
| Authentication context/API | Empty placeholders |
| Protected/role routes | Empty placeholders |
| Department approvals | Empty placeholders |
| Price-history UI | Empty placeholders |
| Salary UI | Empty placeholders |
| Frontend tests | Missing |

## Existing Working Navigation

```text
/login → /home
          ├── /requests/new
          └── /dashboard
```

The temporary credentials are frontend-only:

```text
Employee: DEV001 / Employee@123
Manager:  DEV004 / Admin@123
```

Replace `developmentAuth.ts` with the backend auth API when Person 1 completes it.

## Frontend Person 1 — Authentication, Layout, and Routes

### Files

```text
frontend/src/context/AuthContext.tsx
frontend/src/hooks/useAuth.ts
frontend/src/routes/ProtectedRoute.tsx
frontend/src/routes/RequireRole.tsx
frontend/src/services/api.ts
frontend/src/services/authApi.ts
frontend/src/components/layout/AppLayout.tsx
frontend/src/components/layout/Header.tsx
frontend/src/components/layout/Sidebar.tsx
frontend/src/pages/ForbiddenPage.tsx
frontend/src/pages/NotFoundPage.tsx
frontend/src/styles/global.css
frontend/src/styles/layout.css
```

### Tasks

- Connect login to `/api/auth/login` and `/api/auth/me`.
- Remove temporary frontend credentials after backend integration.
- Store/restore the current user safely.
- Protect signed-in routes and enforce department roles.
- Build the shared header/sidebar layout.
- Show employee navigation to every account.
- Add department navigation according to roles.
- Implement sign-out, forbidden, not-found, and common API errors.
- Preserve the existing `/home` choice page.

## Frontend Person 2 — Employee Requests

### Files

```text
frontend/src/pages/NewRequestPage.tsx
frontend/src/pages/MyRequestsPage.tsx
frontend/src/pages/RequestDetailsPage.tsx
frontend/src/components/requests/RequestForm.tsx
frontend/src/components/requests/RequestList.tsx
frontend/src/components/requests/RequestCard.tsx
frontend/src/components/requests/RequestSummary.tsx
frontend/src/components/requests/RequestTracker.tsx
frontend/src/components/requests/AuditTrail.tsx
frontend/src/services/requestApi.ts
frontend/src/hooks/useRequests.ts
frontend/src/styles/requests.css
```

### Tasks

- Convert the designed request form into the shared API input shape.
- Combine date/time controls into ISO `departureAt` and `returnAt` values.
- Resolve unsupported fields: origin, notes, ticket amount, and receipt upload.
- Validate and submit through `POST /api/requests`.
- Do not show an employee salary preview.
- Build My Requests with in-progress, completed, and cancelled filters.
- Replace hardcoded details/tracker data with API results.
- Remove the extra unsupported financial-approval stage from the tracker.
- Show cancellation reason when cancelled.
- Show final confirmed price only when completed.
- Handle loading, empty, validation, forbidden, missing, conflict, and server-error states.

## Frontend Person 3 — Department Workflow and Price History

### Files

```text
frontend/src/pages/ApprovalsPage.tsx
frontend/src/components/workflow/ApprovalQueue.tsx
frontend/src/components/workflow/DepartmentReviewPanel.tsx
frontend/src/components/workflow/ManagerActions.tsx
frontend/src/components/workflow/PrReviewForm.tsx
frontend/src/components/workflow/TransportationReviewForm.tsx
frontend/src/components/workflow/TimingReviewForm.tsx
frontend/src/components/pricing/CalculationBreakdown.tsx
frontend/src/components/pricing/PriceComparison.tsx
frontend/src/components/pricing/PriceDifferenceBadge.tsx
frontend/src/components/pricing/PriceHistoryTimeline.tsx
frontend/src/services/workflowApi.ts
frontend/src/hooks/useApprovalQueue.ts
frontend/src/styles/approvals.css
```

### Tasks

- Build one reusable department queue filtered by backend authorization.
- Manager: show initial calculation; approve or reject with reason.
- PR: compare/edit accommodation; show price before/after; approve.
- Transportation: edit destination, method, and cost; show comparison; approve.
- Timing: verify dates/hours; show comparison and seven-hour result; approve.
- Show all recorded earlier price revisions to the current department.
- Allow administrators to process their own requests.
- Never let UI role checks replace backend authorization.
- Refresh after actions and explain stale/out-of-order conflicts.

## Frontend Person 4 — Salary, Shared States, and Quality

### Files

```text
frontend/src/pages/SalaryDashboardPage.tsx
frontend/src/components/salary/SalaryReviewPanel.tsx
frontend/src/components/salary/SalaryAdjustmentForm.tsx
frontend/src/components/salary/FinalizeDialog.tsx
frontend/src/components/ui/LoadingState.tsx
frontend/src/components/ui/EmptyState.tsx
frontend/src/components/ui/ErrorState.tsx
frontend/src/components/ui/ConfirmDialog.tsx
frontend/src/services/salaryApi.ts
frontend/src/styles/salary.css
frontend/src/test/setup.ts
```

### Tasks

- Build the Salary queue and full prior price history.
- Display verified request information and calculation breakdown.
- Allow only bonus and penalty edits.
- Show Salary before/after comparison.
- Confirm finalization with request ID, employee, and official total.
- Make completed requests read-only and remove them from the pending queue.
- Build reusable loading, empty, error, and confirmation components.
- Add frontend test setup and tests for all roles and states.

## Dashboard Developer

The dashboard is already assigned to another person. It should provide:

- New Request and My Requests actions for every account.
- Personal in-progress/completed/cancelled summaries.
- A department-queue card when the user has an administrative role.
- No employee price information before completion.
- Clear separation between personal requests and department work.

Avoid implementing workflow actions directly inside the dashboard. Link to `/approvals`, `/salary`, or request details.

## Required Routes

| Path | Access |
| --- | --- |
| `/login` | Public |
| `/home` | Signed in |
| `/dashboard` | Signed in |
| `/requests` | Signed in |
| `/requests/new` | Signed in |
| `/requests/:id` | Authorized viewer |
| `/approvals` | Manager, PR, Transportation, Timing |
| `/salary` | Salary |
| `/forbidden` | Signed in |
| `*` | Not found |

## Frontend Tests Required

- Login success/failure, restore, and sign-out.
- Protected and role-restricted routes.
- Request form conversion and validation.
- Employee receives no intermediate prices.
- My Requests loading, empty, success, and error states.
- Dynamic request tracker and cancellation reason.
- Completed request final price.
- Every department's permitted fields/actions.
- Previous price revision timeline and before/after comparison.
- Manager-only rejection.
- Salary adjustment and confirmation.
- Self-processing by an administrator.
- Stale action and backend error handling.

## Recommended Implementation Order

```text
1. Auth context, API client, and protected layout
2. Employee request API integration and My Requests
3. Dynamic details, tracker, and final-price visibility
4. Department queue and price-revision components
5. Salary finalization
6. Tests and accessibility
```

## Frontend Definition of Done

- Real backend authentication replaces the temporary frontend login.
- Every account has employee self-service.
- Administrative work is separate and role-aware.
- Employees cannot access intermediate prices through the UI or API.
- Departments see prior revisions and their own before/after comparison.
- Every form uses shared contracts and backend APIs.
- All loading, empty, validation, permission, conflict, and error states work.
- Type-check, tests, and production build pass.
