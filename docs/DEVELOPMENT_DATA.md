<!-- Stable fictional fixtures used by the in-memory backend and frontend API testing. -->

# Development Data

The project uses deterministic, fictional in-memory data until company authentication and database requirements are confirmed. This data is safe for development, demos, frontend integration, and automated tests. It resets whenever the backend process restarts or `resetStoreForTests()` is called.

## Correct Usage

```text
Frontend → HTTP API → Backend services → Memory store → Development fixtures
```

The frontend should not import files from `backend/src/data`. It should receive these records through the same API it will use in production. This ensures dummy testing exercises validation, permissions, serialization, and error handling.

Backend unit tests may import the memory store and reset it before each test.

## Development Company

| Field | Value |
| --- | --- |
| ID | `company-egas-dev` |
| Name | EGAS Development Company |
| Short name | EGAS DEV |
| Currency | EGP |
| Timezone | Africa/Cairo |

The company record is intentionally labelled as development data. No production policy, credential, or employee information belongs in these files.

## Stable Users

All accounts are fictional. Administrative users also have the `employee` role, allowing every staff member to create a personal request during testing.

| ID | Employee number | Display name | Job level | Roles |
| --- | --- | --- | --- | --- |
| `u1` | `DEV001` | Mariam Hassan (Demo) | Level 1 | Employee |
| `u2` | `DEV002` | Omar Nabil (Demo) | Level 2 | Employee |
| `u3` | `DEV003` | Salma Fathy (Demo) | Level 3 | Employee |
| `u4` | `DEV004` | Karim Adel (Demo Manager) | General Manager | Employee, Manager |
| `u5` | `DEV005` | Nour Samir (Demo PR) | Assistant | Employee, PR |
| `u6` | `DEV006` | Youssef Amin (Demo Transportation) | Level 1 | Employee, Transportation |
| `u7` | `DEV007` | Dina Hany (Demo Timing) | Level 2 | Employee, Timing |
| `u8` | `DEV008` | Tarek Mostafa (Demo Salary) | General Manager | Employee, Salary |
| `u9` | `DEV009` | Heba Magdy (Demo Salary) | Assistant General Manager | Employee, Salary |

Two Salary accounts exist so separation-of-duties behavior can be tested without allowing a Salary user to finalize their own personal request.

No passwords are defined here. Person 1 should connect the chosen development authentication mechanism to employee numbers without storing real credentials.

## Stable Request Scenarios

| Request ID | Owner | Stage | Purpose |
| --- | --- | --- | --- |
| `TR-2026-001` | `u1` | Manager review | New submission and Manager queue |
| `TR-2026-002` | `u2` | PR review | PR queue and accommodation review |
| `TR-2026-003` | `u3` | Transportation review | Transportation queue |
| `TR-2026-004` | `u1` | Timing review | Same-day timing scenario |
| `TR-2026-005` | `u2` | Salary finalization | Verified request ready for Salary |
| `TR-2026-006` | `u3` | Completed | Locked request with final salary and full audit trail |
| `TR-2026-007` | `u1` | Cancelled | Manager rejection reason and terminal locking |

Each request contains at least one audit event. Later-stage examples contain the preceding approval history. The completed record contains a non-null final breakdown, and the cancelled record contains a reason.

Expected preview totals provide stable frontend assertions:

| Request ID | Expected preview total |
| --- | ---: |
| `TR-2026-001` | 480.00 EGP |
| `TR-2026-002` | 232.50 EGP |
| `TR-2026-003` | 280.00 EGP |
| `TR-2026-004` | 100.00 EGP before Timing verification |
| `TR-2026-005` | 448.00 EGP |
| `TR-2026-006` | 378.00 EGP final |
| `TR-2026-007` | 140.00 EGP preview before cancellation |

## Useful Dummy-Test Journeys

### Employee view

Use `DEV001`/`u1` to verify that an employee can see:

- One request awaiting Manager review.
- One request at Timing review.
- One cancelled request with a reason.

They must not receive another employee's private requests merely because those records exist in the store.

### Department queues

- Sign in as `DEV004` to test the Manager queue with `TR-2026-001`.
- Sign in as `DEV005` to test the PR queue with `TR-2026-002`.
- Sign in as `DEV006` to test Transportation with `TR-2026-003`.
- Sign in as `DEV007` to test Timing with `TR-2026-004`.
- Sign in as `DEV008` or `DEV009` to test Salary with `TR-2026-005`.

### Terminal records

- `TR-2026-006` must be read-only because it is completed.
- `TR-2026-007` must be read-only because it is cancelled.

### Administrator personal requests

Every administrative fixture also includes the employee role. Use any administrator to verify that they can create a request for themselves while retaining access to their department queue.

## Storage API

The memory store exports:

```text
listUsers
findUserById
findUserByEmployeeNumber
listRequests
findRequestById
createRequest
updateRequest
addAuditEvent
resetStoreForTests
resetStore
```

Storage behavior:

- Results are cloned so callers cannot silently mutate stored records.
- IDs, employee ownership, and creation timestamps are preserved during updates.
- Audit history can only be appended.
- Duplicate request IDs are rejected.
- Missing lookup returns `undefined`; missing update returns `null`.
- Reset produces fresh nested fixtures.

Services remain responsible for deciding which fields a role may update. Storage protects data integrity but does not replace workflow authorization.

## Test Setup

```ts
import { beforeEach } from "vitest";
import { resetStoreForTests } from "../src/storage/memoryStore.js";

beforeEach(() => {
  resetStoreForTests();
});
```

Do not make tests depend on execution order. Every test that changes stored state should reset first.

## Replacing the Memory Store Later

The company database adapter should implement equivalent named operations. Routes and business services should not require rewrites merely because storage changes from arrays to a database.

Future production work still requires decisions about:

- Database technology and schema.
- Active Directory protocol and group mapping.
- Transaction behavior and concurrency control.
- Record retention and payroll-period policy.
- Real company locations and transportation prices.

Do not add real employee data to the development fixtures when those decisions are made.
