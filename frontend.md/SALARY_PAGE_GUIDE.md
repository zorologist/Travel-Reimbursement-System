<!-- Frontend implementation guide for the Salary employee dashboard and finalization workflow. -->

# Salary Employee Page Guide

## Purpose

The Salary page is the working area for a signed-in user with the `salary` role. That person has two separate responsibilities:

1. They are a company employee and may create and track their own travel requests, just like any other signed-in staff member.
2. They are a Salary administrator and may review requests that have reached `salary-finalization`, apply a bonus or penalty, inspect the calculation and audit history, and finalize the official payment.

These responsibilities must remain visually separate so “my requests” is not confused with “requests assigned to Salary.” Self-processing is allowed: when a Salary employee's personal request reaches `salary-finalization` through the normal workflow, that user may open it from the Salary queue and finalize it.

## Recommended User Experience

After a Salary employee signs in, send them to a Salary dashboard at:

```text
/salary
```

The page should have two clear sections or tabs:

| Section | Purpose | Access |
| --- | --- | --- |
| My Travel Requests | Create and track the signed-in user's own requests | Every signed-in staff member |
| Salary Review Queue | Review and finalize requests awaiting Salary | `salary` role only |

The primary actions should be:

- **New Travel Request** — opens `/requests/new` for the user's own mission.
- **View My Requests** — opens `/requests` filtered by the signed-in user's ID.
- **Review Salary Requests** — shows requests at `salary-finalization`.
- **Open Request** — opens `/requests/:id` with the salary calculation and audit history.
- **Finalize Payment** — performs the irreversible Salary workflow action after confirmation.

Do not place a “Create request for another employee” action on this page unless the company explicitly approves that permission later. The current requirement is that administrators can create requests **for themselves**.

## Capability Model

The existing shared user contract contains system roles such as `employee` and `salary`. It should not be interpreted to mean that a Salary user stops being a normal employee.

Use this rule:

```text
Authenticated staff capability
├── Create and view their own travel requests
└── Available to every signed-in company user

Salary role capability
├── View the Salary review queue
├── View the initial calculation and every earlier price revision
├── Review verified request information
├── Apply bonus or penalty
├── Finalize and lock the official payment
└── Process their own request when it reaches Salary
```

The backend must enforce these capabilities. Hiding a button in React is not authorization.

Administrative accounts use role arrays. A Salary user has both roles:

```ts
roles: ["employee", "salary"]
```

The same rule applies to Manager, PR, Transportation, and Timing accounts: every administrator also has the `employee` role.

## Where the Frontend Files Belong

Build the page inside the existing React application. Do not create a standalone `salary.html` file.

```text
frontend/src/
├── pages/
│   └── SalaryDashboardPage.tsx       Complete Salary landing page
├── components/
│   ├── workflow/
│   │   └── ApprovalQueue.tsx          Filterable role-aware request list
│   ├── salary/
│   │   ├── SalaryReviewPanel.tsx      Selected request review form
│   │   ├── SalaryAdjustmentForm.tsx  Bonus and penalty controls
│   │   └── FinalizeDialog.tsx         Irreversible-action confirmation
│   └── pricing/
│       ├── CalculationBreakdown.tsx  Complete calculation details
│       ├── PriceHistoryTimeline.tsx  Earlier department revisions
│       ├── PriceComparison.tsx       Salary before/after values
│       └── PriceDifferenceBadge.tsx  Positive/negative/no-change amount
├── services/
│   ├── api.ts                        Central HTTP/error handling
│   └── salaryApi.ts                  Salary-specific API functions
├── styles/
│   └── salary.css                    Page-specific layout and styling
└── App.tsx                            Route registration and protection
```

### Why this structure is recommended

- `pages/` coordinates the complete route and data-loading states.
- `components/salary/` contains reusable, testable pieces of the page.
- `services/` keeps HTTP calls out of visual components.
- `styles/` keeps the page connected to Vite's production asset pipeline.
- `App.tsx` makes the page part of React Router and applies authentication and role guards.

The existing generic `ApprovalQueue` may be extended if it stays understandable. Salary-specific calculation and finalization controls should still live in focused Salary components rather than making one generic component handle every possible workflow behavior.

## Route Registration

Register the page in `frontend/src/App.tsx`:

```tsx
import { SalaryDashboardPage } from "./pages/SalaryDashboardPage";

<Route
  path="/salary"
  element={
    <RequireRole role="salary">
      <SalaryDashboardPage />
    </RequireRole>
  }
/>
```

`RequireRole` is illustrative; the project still needs an authentication provider and protected-route component. A user who is not signed in should be sent to `/login`. A signed-in user without the `salary` role should see a clear forbidden page, not a blank screen.

The personal request routes should require authentication but should not require the `salary` role:

```text
/requests/new
/requests
/requests/:id
```

## Suggested Page Layout

```text
┌────────────────────────────────────────────────────────────┐
│ Header: Salary Dashboard              User / role / logout │
├────────────────────────────────────────────────────────────┤
│ [New Travel Request] [My Requests]                         │
├────────────────────────────────────────────────────────────┤
│ Awaiting review │ Finalized today │ Total pending amount   │
├────────────────────────────────────────────────────────────┤
│ Search  Status  Employee  Date range  [Refresh]            │
├──────────────────────────────┬─────────────────────────────┤
│ Salary review queue          │ Selected request            │
│ - request ID                 │ - employee and trip details │
│ - employee                   │ - verified timing           │
│ - destination               │ - calculation breakdown     │
│ - submitted/updated date    │ - audit trail               │
│ - preview total             │ - bonus and penalty         │
│ - status                    │ - prior price timeline      │
│                             │ - Salary before/after       │
│                             │ - finalization note/button  │
└──────────────────────────────┴─────────────────────────────┘
```

On smaller screens, stack the selected-request panel below the queue or navigate to `/requests/:id`. Do not squeeze a wide financial table into an unreadable mobile layout.

## Salary Review Queue

The queue should initially contain only requests visible to the current Salary employee and currently at:

```ts
stage === "salary-finalization"
```

Recommended columns:

- Request ID
- Employee name and employee number
- Destination
- Departure and return dates
- Last updated time
- Calculated preview total
- Review status
- Open action

Useful queue behavior:

- Search by request ID, employee name, or employee number.
- Filter by pending/completed status and date range.
- Sort by oldest waiting request, newest update, or amount.
- Show a clear empty state when nothing awaits review.
- Refresh after edits or finalization.
- Preserve filters while opening and returning from a request.
- Use pagination when the API supports it; do not download an unlimited history.

The backend remains responsible for role-aware filtering. A frontend query such as `stage=salary-finalization` is a convenience, not a security boundary.

## Information Salary Must See

Before finalizing, display the stored, verified information used in the calculation:

- Employee identity and job level
- Destination and transportation method
- Original departure and return dates
- Timing-verified departure and return values
- Same-day verified hours
- Return-day verified hours
- Accommodation type
- Transportation cost
- Daily salary rate
- Overnight count and amount
- Same-day amount
- Return-day amount
- Bonus
- Penalty
- Final total
- Complete audit trail
- Initial system calculation
- Manager, PR, Transportation, and Timing price revisions
- Price entering Salary
- Price after Salary bonus/penalty
- Difference between those two totals

Clearly label original information and department-verified information. Salary should be able to detect why the total changed without manually reconstructing the formula.

## Calculation Breakdown

Never show only one unexplained total. Use the shared `SalaryCalculationResult` fields:

```text
Daily rate
Overnight amount
Same-day amount
Return-day amount
Transportation cost
Bonus
- Penalty
──────────────────
Official total
```

All amounts should be formatted as EGP with two decimal places. Formatting is a presentation concern; calculation and rounding must remain in shared/backend code.

The frontend may display the server-provided calculation inside the authorized Salary workspace, but it must not calculate or submit an authoritative `finalSalary` or `totalAmount`. The server recalculates from stored data and returns the official breakdown. The employee-facing personal-request view must not display this calculation before completion.

## Price Revision History

Salary is the final department and therefore sees the complete price history:

```text
Initial system calculation
→ Manager before/after
→ PR before/after
→ Transportation before/after
→ Timing before/after
→ Salary before/final
```

Every financial revision should display the department, actor, timestamp, changed fields, total before, total after, difference, and note. Approval events that do not affect the amount may show “No price change.” Salary must not reconstruct old prices in the browser; the backend returns stored calculation revisions.

## What the Salary Employee May Edit

The Salary employee may edit only:

- `bonusAmount`
- `penaltyAmount`
- An optional audit/finalization note, if supported by the endpoint

They must not edit:

- Employee or job level
- Destination
- Accommodation
- Transportation method or cost
- Verified dates or hours
- Workflow stage
- Daily rate
- Calculated component amounts
- Final total directly

If verified information is wrong, provide a clearly labelled **Report an issue** or **Return for correction** suggestion only after the business approves a backward workflow. The confirmed first version does not permit requests to move backward, so the initial page should instruct Salary to contact the responsible department outside the system rather than silently changing its fields.

## Bonus and Penalty Form

Recommended validation:

- Accept numbers with at most two decimal places.
- Require values greater than or equal to zero.
- Treat an empty field as zero only when this behavior is clearly shown.
- Do not allow `NaN`, infinity, negative values, or pasted non-numeric text.
- Show the recalculated server preview after saving an adjustment.
- Require a note when a non-zero bonus or penalty is applied; this is recommended for audit clarity.
- Disable saving when nothing changed.

Do not subtract the penalty in the browser and then send a final total. Send only the permitted adjustment fields and let the backend return the new calculation.

## Finalization Behavior

Finalization is irreversible in the current workflow. The button should therefore:

1. Be visible only for a Salary user viewing a request at `salary-finalization`.
2. Be disabled while adjustment changes are unsaved or an API request is running.
3. Open a confirmation dialog showing the request ID, employee, and official total.
4. Require an explicit confirmation action.
5. Call the finalization endpoint once.
6. Replace the editable view with a completed, read-only view.
7. Refresh queue counts and remove the request from the pending queue.
8. Show a useful error if another user already finalized or changed the request.

The confirmation text should state that the amount will be locked and cannot be edited afterward.

## Implemented Backend API

The frontend page uses these implemented endpoints:

| Method | Endpoint | Use on this page |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Restore the current user and roles |
| `GET` | `/api/requests` | Load personal requests or the Salary queue using backend visibility rules |
| `POST` | `/api/requests` | Create the Salary employee's own travel request |
| `GET` | `/api/requests/:id` | Load details, calculation, and audit history |
| `PATCH` | `/api/requests/:id/review` | Save permitted bonus/penalty changes |
| `POST` | `/api/requests/:id/finalize` | Recalculate, save the official total, complete, and lock |

The frontend service can expose functions similar to:

```ts
export function listSalaryQueue(filters?: SalaryQueueFilters) {}
export function getSalaryRequest(requestId: string) {}
export function updateSalaryAdjustments(
  requestId: string,
  input: { bonusAmount: number; penaltyAmount: number; note?: string },
) {}
export function finalizeSalaryRequest(
  requestId: string,
  input: { note?: string },
) {}
```

These functions belong in `salaryApi.ts` and should call the shared HTTP helper in `api.ts`. React components should not contain raw API URLs.

## Expected Backend Rules

The Salary page cannot be completed safely until the backend enforces all of the following:

- The actor comes from the authenticated session, never from a submitted actor ID.
- Only the `salary` role can access Salary actions.
- The request must currently be at `salary-finalization`.
- Bonus and penalty must be valid non-negative monetary values.
- The backend derives job level, rates, verified time, accommodation, and transport from storage.
- The backend recalculates after every adjustment.
- The browser's total or `finalSalary` is ignored or rejected.
- Finalization saves the complete `finalSalary` breakdown.
- Finalization creates an audit event and changes the stage to `completed`.
- Completed and cancelled requests cannot be edited.
- Simultaneous or stale actions return a predictable conflict error.

## Page States That Must Be Designed

The page is not complete with only the successful state. Implement:

- Initial loading
- Queue loading
- Empty queue
- Queue load failure with retry
- Request detail loading
- Request not found
- Not signed in
- Signed in without Salary permission
- Validation errors
- Save in progress and save failure
- Finalization in progress and failure
- Stale or already-finalized request
- Completed read-only request
- Cancelled read-only request

Do not erase entered adjustments after a recoverable network error.

## Audit Trail Requirements

Show audit events in chronological or clearly reversible order. Each entry should explain:

- Who performed the action
- Their role
- When it occurred
- The action performed
- Previous and next stage
- Changed fields with before/after values
- Note or reason

Salary adjustment events should make bonus and penalty changes easy to understand. The finalization event should show the transition from `salary-finalization` to `completed`.

## Additional Useful Features

These are reasonable additions related to the Salary page, but they should be prioritized after the required workflow works:

### Good first-version additions

- Pending-request count and oldest-waiting age
- “Finalized by me today” history
- Saved queue filters
- Clear warnings for unusually large bonus or penalty values
- Print-friendly completed salary breakdown
- Copy request ID button
- Keyboard-friendly queue navigation
- Arabic/English labels using one consistent translation approach

### Add only with backend and business approval

- Export completed payments to CSV or Excel
- Batch finalization
- Approval thresholds for large totals
- Return-to-department workflow
- Comments or internal discussion thread
- Supporting document preview/download
- Notifications when a request reaches Salary
- Payroll-period grouping and closing
- Duplicate-trip or duplicate-payment warnings
- Analytics by department, destination, or payment period

Batch actions and exports involve financial and personal information. They require explicit authorization, audit logging, data-scope rules, and confirmation before implementation.

## Accessibility and Presentation

- Use visible labels for every financial input.
- Do not communicate status through color alone.
- Keep focus inside the finalization dialog until it closes.
- Return focus to the triggering button after cancellation.
- Make tables usable by keyboard and provide a responsive list alternative where needed.
- Use `aria-live` or a status region for save/finalization results.
- Format dates consistently and show the relevant timezone.
- Clearly distinguish preview, adjusted preview, and official finalized amount.
- Support RTL across the entire layout if Arabic is selected, not only inside individual fields.

## Security and Privacy

- Do not store full request or salary records in `localStorage`.
- Do not log salary data, access tokens, or employee information to the browser console.
- Do not trust role, actor ID, stage, or totals sent by the browser.
- Avoid exposing requests outside the authenticated user's backend-defined visibility.
- Do not expose intermediate prices through the personal employee view. They are visible only in authorized department workspaces until completion.
- Clear sensitive page state on logout.
- Require reloading the request before retrying a conflict rather than overwriting newer data.

## Testing Checklist

### Page and component tests

- Salary user sees both personal-request and Salary-review actions.
- Other administrative roles can create personal requests but cannot see Salary controls.
- Non-Salary users cannot open `/salary`.
- Queue loading, empty, success, and failure states render correctly.
- Search, filtering, and sorting work.
- Calculation fields and EGP formatting are correct.
- Invalid bonus and penalty values are rejected.
- Salary cannot edit department-owned fields or the final total.
- Finalization requires confirmation.
- Successful finalization makes the request read-only and updates the queue.
- Conflict and already-finalized responses are explained clearly.
- Audit before/after values are displayed.
- The initial calculation and every earlier department price revision are displayed.
- Salary's before/after price comparison is correct.
- A Salary user can finalize their own request after it reaches the Salary queue.

### Integration/API tests

- Browser-supplied actor, role, rate, or total is ignored/rejected.
- Only Salary can adjust and finalize.
- Only `salary-finalization` requests can be finalized.
- Adjustments trigger server-side recalculation and audit events.
- Finalization stores the complete breakdown and locks the request.
- A Salary employee can submit a personal request, cannot use Salary permissions before it reaches Salary, and may finalize it after it appears in the Salary queue.

## Recommended Implementation Order

1. Finish development authentication and role restoration.
2. Use the confirmed dual-role model: every administrator also has the `employee` role.
3. Implement backend request listing, detail, adjustment, and finalization endpoints.
4. Build the central API helper and `salaryApi.ts`.
5. Add the protected `/salary` route and basic page states.
6. Build the queue and request details.
7. Add the salary breakdown and adjustment form.
8. Add confirmation and finalization behavior.
9. Add the audit trail and completed read-only state.
10. Add tests, responsive behavior, accessibility, and optional enhancements.

## Definition of Done

The Salary page is complete when:

- A Salary employee can create and track a personal travel request.
- The same user can separately view only the requests assigned to Salary.
- A Salary user can process their own request after it reaches the Salary queue.
- Salary can inspect all verified inputs and the complete calculation breakdown.
- Salary can inspect the initial calculation and all earlier department revisions.
- Salary sees an accurate before/after comparison for its own adjustment.
- Salary can change only bonus and penalty values.
- Every adjustment is recalculated by the backend and audited.
- Finalization saves the official breakdown, completes the request, and locks it.
- Unauthorized, stale, completed, and cancelled actions are safely handled.
- Loading, empty, validation, forbidden, conflict, and server-error states are usable.
- The page is accessible and works at the agreed responsive screen sizes.
- Frontend type checking, tests, and production build pass.

## Confirmed Product Rules

- Every Salary account also has the `employee` role.
- Salary users may process and finalize their own requests after the normal earlier approvals.
- Employees see no calculation or price while a request is in progress.
- Employees see the final confirmed price after completion.
- Salary sees the initial system calculation and every earlier department revision.
- Salary may edit only bonus, penalty, and an agreed note/reason field.
- Salary finalization is irreversible and locks the official breakdown.

Presentation choices still to confirm include whether a non-zero bonus/penalty note is mandatory, completed-history retention, export/printing requirements, and whether the interface is Arabic, English, or fully bilingual.
