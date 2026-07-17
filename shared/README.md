<!-- This guide explains how one developer should build and maintain the code shared by the frontend and backend. -->

# Shared Code Developer Guide

The `shared` folder contains the agreement between the frontend and backend. It defines the same names, data shapes, workflow stages, salary rates, and salary calculations for both applications.

One person should own this folder at the beginning of the project. That person should work with both teams before either side builds features around incorrect assumptions.

## Why Shared Code Comes First

The frontend and backend exchange JSON data. They must agree on what every field means.

For example, if the frontend sends `status` but the backend expects `stage`, the feature will fail even if both applications run correctly. Shared types prevent this kind of mismatch.

The shared developer does not build pages, Express routes, or storage. They define the contracts and pure rules those parts use.

## Language and Tools

- **Language:** TypeScript
- **Validation:** Zod, when runtime schemas are added
- **Testing:** Vitest
- **Data format:** JSON-compatible objects

Shared code must work in both a browser and Node.js. Do not import React, Express, filesystem APIs, environment variables, or database libraries into this folder.

## Files Owned by This Developer

```text
shared/
├── constants/
│   ├── salaryRates.ts
│   └── transportationRates.ts
├── salary/
│   ├── calculateSalary.ts
│   └── calculateSalary.test.ts
├── schemas/
│   ├── UserSchema.ts
│   ├── TravelRequestSchema.ts
│   └── WorkflowActionSchema.ts
├── types/
│   ├── User.ts
│   ├── TravelRequest.ts
│   └── Workflow.ts
└── README.md
```

## Confirmed Implementation Decisions

These decisions are the source of truth for the first development version:

1. Seven hours qualifies for payment. The comparison is `hours >= 7`, not `hours > 7`.
2. One overnight stay equals one full allowance day.
3. Monday to Wednesday means two nights plus one return day.
4. Accommodation deductions apply to full nights but do not apply to the 30% return-day allowance.
5. A same-day mission with at least seven verified hours receives 50% of the daily rate.
6. A return day with at least seven verified hours receives 30% of the daily rate.
7. A same-day mission or return day below seven verified hours receives no allowance for that day.
8. The Salary administrator may add a manual bonus or penalty before finalization.
9. Bonuses and penalties use fixed EGP amounts in the first version, not percentages.
10. Transportation uses temporary city prices. Exact company prices will replace them later.
11. A Manager may approve or reject. Manager rejection cancels the request.
12. PR, Transportation, Timing, and Salary cannot reject a request. They may edit their permitted fields and approve or finalize it.
13. PR may edit accommodation information.
14. Transportation may edit transportation method, city, and cost.
15. Timing may edit verified dates and hours.
16. Salary may edit bonus and penalty amounts and finalize the request.
17. User roles will eventually come from Active Directory. For now, model `roles` as an array so one or more directory groups can be mapped later.
18. Round monetary values to two decimal places. Calculate using full precision and round each returned breakdown amount and the final total.
19. Dates and timestamps crossing the API use ISO 8601 strings.
20. IDs are strings so the future company system can provide its own identifier format.

The Active Directory group mapping, actual city prices, and actual company records are configuration work for later. The shared developer must not invent or hard-code real company information.

## Required Shared Contracts

The exact TypeScript syntax may be organized differently, but the first version must represent the following information with clear exported types.

### User contract

```ts
type SystemRole =
  | "employee"
  | "manager"
  | "pr"
  | "transportation"
  | "timing"
  | "salary";

interface User {
  id: string;
  employeeNumber: string;
  displayName: string;
  jobLevel: JobLevel;
  roles: SystemRole[];
}
```

`jobLevel` selects the allowance rate. `roles` controls system permissions. They must remain separate.

### Travel request input contract

```ts
interface CreateTravelRequestInput {
  destinationCity: string;
  departureAt: string;
  returnAt: string;
  accommodationType: AccommodationType;
  transportationMethod: string;
}
```

The employee ID, request ID, stage, timestamps, official transportation cost, audit trail, and final salary must be created or verified by the backend rather than trusted from employee input.

The complete `TravelRequest` must extend those submitted fields with:

```ts
interface TravelRequest extends CreateTravelRequestInput {
  id: string;
  employeeId: string;
  stage: WorkflowStage;
  verifiedDepartureAt: string | null;
  verifiedReturnAt: string | null;
  verifiedSameDayHours: number;
  verifiedReturnDayHours: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  salaryPreview: SalaryCalculationResult;
  finalSalary: SalaryCalculationResult | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  auditEvents: AuditEvent[];
}
```

The implementation may split a detailed object into smaller named types, but it must not omit the information above.

### Accommodation contract

```ts
type AccommodationType =
  | "none"
  | "room-only"
  | "room-and-food";
```

| Accommodation | Employee receives for each full night |
| --- | ---: |
| None provided | 100% |
| Room only | 75% |
| Room and food | 50% |

### Workflow contract

```ts
type WorkflowStage =
  | "manager-review"
  | "pr-review"
  | "transportation-review"
  | "timing-review"
  | "salary-finalization"
  | "completed"
  | "cancelled";

type WorkflowAction = "submit" | "approve" | "edit" | "reject" | "finalize";
```

Every edit, approval, rejection, and finalization must produce this information:

```ts
interface AuditEvent {
  id: string;
  requestId: string;
  actorId: string;
  actorRole: SystemRole;
  action: WorkflowAction;
  fromStage: WorkflowStage | null;
  toStage: WorkflowStage;
  changes: Record<string, { before: unknown; after: unknown }>;
  note: string | null;
  createdAt: string;
}
```

### Salary calculation contract

The calculator input must provide everything needed for deterministic calculation:

```ts
interface SalaryCalculationInput {
  jobLevel: JobLevel;
  accommodationType: AccommodationType;
  overnightCount: number;
  isSameDayMission: boolean;
  sameDayVerifiedHours: number;
  returnDayVerifiedHours: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
}
```

The result must include a breakdown, not only a total:

```ts
interface SalaryCalculationResult {
  dailyRate: number;
  overnightCount: number;
  overnightAmount: number;
  sameDayAmount: number;
  returnDayAmount: number;
  transportationCost: number;
  bonusAmount: number;
  penaltyAmount: number;
  totalAmount: number;
}
```

An overnight request uses `overnightCount` and the return-day rule. A same-day request uses the same-day rule and must have `overnightCount` equal to zero. It must not also receive a return-day amount.

## Recommended Implementation Order

### 1. Define users and roles

Start with `types/User.ts`.

Define:

- The common `User` structure
- System roles such as employee, manager, PR, transportation, timing, and salary
- Employee job levels used for salary calculations

Keep system permission roles separate from employee job levels. A manager's system access and their salary level are different concepts.

Use a `roles` array for development. The later Active Directory integration will map directory groups to these roles without changing the rest of the application.

### 2. Define workflow stages and actions

Continue with `types/Workflow.ts`.

Define:

- Every workflow stage
- The correct stage order
- Available actions such as submit, approve, reject, correct, and finalize
- An audit-event structure
- Rejection and correction information

The workflow should represent employee submission followed by:

1. Manager review
2. PR review
3. Transportation review
4. Timing review
5. Salary finalization

The backend will enforce these stages. The frontend will use them to display progress and available actions.

Use this transition table:

| Current stage | Allowed role | Allowed actions | Next result |
| --- | --- | --- | --- |
| Manager review | Manager | Approve, reject | PR review or cancelled |
| PR review | PR | Edit accommodation, approve | Transportation review |
| Transportation review | Transportation | Edit transportation, approve | Timing review |
| Timing review | Timing | Edit verified dates/hours, approve | Salary finalization |
| Salary finalization | Salary | Edit bonus/penalty, finalize | Completed |
| Completed | None | None | Remains completed |
| Cancelled | None | None | Remains cancelled |

Only Manager rejection exists in the first version. No later department should receive or expose a reject action.

### 3. Define the travel request

Continue with `types/TravelRequest.ts`.

Define the fields required by both applications, including:

- Request ID
- Employee ID
- Destination
- Departure and return date/time
- Accommodation type
- Transportation information
- Current workflow stage
- Salary preview and final amount
- Creation and update timestamps
- Rejection or correction information
- Audit events, if they are returned with the request

Separate input types from completed records where useful. For example:

- `CreateTravelRequestInput` describes what an employee submits.
- `TravelRequest` describes the complete stored record returned by the API.

Do not put database-specific fields or Express request objects in shared types.

### 4. Define salary rates

Continue with `constants/salaryRates.ts`.

Create one clearly named mapping from employee job level to daily allowance:

| Job level | Daily rate |
| --- | ---: |
| Chairman, Deputy, Advisor, Expert | 270 EGP |
| Assistant, Deputy Assistant | 240 EGP |
| General Manager, Assistant General Manager | 200 EGP |
| Level 1 | 140 EGP |
| Level 2 | 110 EGP |
| Level 3 | 60 EGP |

Avoid repeating these numbers in the frontend or backend. Both applications must import the shared values.

Create `constants/transportationRates.ts` with clearly labelled development values:

```ts
export const DEVELOPMENT_TRANSPORTATION_RATES = {
  Cairo: 100,
  Alexandria: 200,
  Suez: 150,
} as const;
```

These are temporary EGP values for development and tests. They are not company prices. Keep them in one mapping so the company can replace them later without changing calculation code.

### 5. Implement salary calculation

Finish with `salary/calculateSalary.ts`.

The calculation should be a pure function. It receives all required information as input and returns a result without reading storage, changing global data, or calling an API.

It must cover:

- Role-based daily rate
- Full travel days
- Accommodation-only 25% deduction
- Accommodation-and-food 50% deduction
- Same-day mission at 50% when verified hours are at least seven
- Return day at 30% when verified hours are at least seven
- Transportation as a separate amount
- Manual bonus or penalty during salary finalization
- Final total and a clear calculation breakdown

Return a breakdown, not only one number. The interface needs to explain how the amount was produced, and the backend needs the same information for auditing.

Use these formulas:

```text
accommodation factor:
  none = 1.00
  room only = 0.75
  room and food = 0.50

overnight amount = daily rate × overnight count × accommodation factor
same-day amount = daily rate × 0.50 when same-day verified hours >= 7, otherwise 0
return-day amount = daily rate × 0.30 when return-day verified hours >= 7, otherwise 0
total = overnight amount
      + same-day amount
      + return-day amount
      + transportation cost
      + bonus amount
      - penalty amount
```

Do not apply the accommodation factor to the return-day amount. Same-day and overnight calculations are mutually exclusive. Reject negative counts, hours, transportation costs, bonuses, and penalties. Round returned EGP amounts to two decimal places.

### Required calculation examples

These tests make the intended behavior explicit:

| Case | Expected allowance before transport/adjustments |
| --- | ---: |
| Level 1, same day, 6.99 hours | 0 EGP |
| Level 1, same day, exactly 7 hours | 70 EGP |
| Level 1, same day, 8 hours | 70 EGP |
| Level 1, two nights, no accommodation provided, 7-hour return day | 322 EGP |
| Level 1, two nights, room only, 7-hour return day | 252 EGP |
| Level 1, two nights, room and food, 7-hour return day | 182 EGP |
| Level 1, two nights, room only, 6.99-hour return day | 210 EGP |

For the two-night room-only example: `(140 × 2 × 0.75) + (140 × 0.30) = 252 EGP`. The return-day amount is not reduced by accommodation.

Transportation, bonus, and penalty are then applied using the total formula. For example, `252 + 100 transportation + 20 bonus - 10 penalty = 362 EGP`.

### 6. Add runtime schemas

TypeScript types disappear when the application runs. After the types are agreed upon, add Zod schemas for information received through the API.

Recommended future structure:

```text
shared/schemas/
├── UserSchema.ts
├── TravelRequestSchema.ts
└── WorkflowActionSchema.ts
```

The backend will use these schemas to reject invalid requests. The frontend can use the same schemas to validate forms before submission. Implement them as part of the first shared-code task, not as optional follow-up work.

### 7. Add tests

Add tests beside important shared logic:

```text
shared/salary/calculateSalary.test.ts
```

Tests should cover:

- Every job level
- Every accommodation option
- Same-day missions below, at, and above seven hours
- Overnight trips and return days
- Confirmation that accommodation does not reduce the return-day amount
- Confirmation that same-day and overnight pay cannot both apply
- Transportation cost remaining separate
- Positive bonuses and negative penalties
- Invalid input
- Money rounding

## How This Developer Works With the Backend

The backend needs shared code to:

- Validate incoming request information
- Determine the signed-in user's role
- Enforce workflow stages
- Calculate the authoritative salary amount
- Store records with consistent field names
- Return predictable JSON responses

The shared developer should give backend developers stable exported names before they implement routes and services.

The backend remains responsible for security and final decisions. Shared types alone do not enforce authorization.

## How This Developer Works With the Frontend

The frontend needs shared code to:

- Build forms with the correct fields
- Display workflow stages consistently
- Show a salary preview
- Understand API responses
- Display validation messages
- Hide actions that do not apply to the current role

The frontend may calculate a preview, but the backend must calculate and return the official amount.

## Handoff Order

The shared developer should deliver work in small stages:

1. User roles and job levels
2. Workflow stages and actions
3. Travel request input and response types
4. Salary rates
5. Salary calculation input, output, and tests
6. Runtime validation schemas

After each stage, frontend and backend developers should review the names and fields before building on them.

## Rules for Shared Code

1. Use clear, complete names instead of unexplained abbreviations.
2. Do not import frontend or backend code into `shared`.
3. Do not store information or make network requests here.
4. Keep salary functions pure and deterministic.
5. Keep all values JSON-compatible when they cross the API.
6. Export one agreed source of truth instead of copying constants.
7. Discuss breaking type changes with both teams.
8. Add tests whenever a business rule is added or changed.
9. Document assumptions that have not yet been confirmed.
10. Never include actual employee or company information in tests.

## Definition of Done

The initial shared layer is ready when:

- User roles and employee job levels are distinct and documented.
- Workflow stages and actions are complete and ordered.
- Request submission and API response types are defined.
- Salary rates exist in one shared mapping.
- Salary calculations return a detailed breakdown.
- All confirmed salary rules have passing tests.
- Invalid inputs are covered by runtime schemas.
- The frontend can import the types and schemas.
- The backend can import the types, schemas, constants, and calculator.
- Neither application needs to copy shared business definitions.
