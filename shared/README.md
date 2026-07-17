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
│   └── salaryRates.ts
├── salary/
│   └── calculateSalary.ts
├── types/
│   ├── User.ts
│   ├── TravelRequest.ts
│   └── Workflow.ts
└── README.md
```

## What to Confirm Before Writing Code

The developer should ask the project owner and backend team to confirm these decisions first:

1. What user roles exist?
2. What employee job levels exist?
3. Which fields are required when submitting a travel request?
4. What are the exact workflow stages and their order?
5. What happens after rejection?
6. Which departments can edit request information?
7. How are travel days and working hours provided?
8. How are accommodation types represented?
9. How is transportation cost provided?
10. Can bonuses and penalties be negative, and who can apply them?
11. What information must appear in the audit trail?
12. Which money-rounding rule should be used?

Unconfirmed decisions should be written down as questions. The developer should not silently invent important company rules.

## Recommended Implementation Order

### 1. Define users and roles

Start with `types/User.ts`.

Define:

- The common `User` structure
- System roles such as employee, manager, PR, transportation, timing, and salary
- Employee job levels used for salary calculations

Keep system permission roles separate from employee job levels. A manager's system access and their salary level are different concepts.

Example questions to resolve:

- Can one user have more than one system role?
- Does every user have an employee number?
- Is a department stored as a role or a separate field?

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

### 5. Implement salary calculation

Finish with `salary/calculateSalary.ts`.

The calculation should be a pure function. It receives all required information as input and returns a result without reading storage, changing global data, or calling an API.

It must eventually cover:

- Role-based daily rate
- Full travel days
- Accommodation-only 25% deduction
- Accommodation-and-food 50% deduction
- Same-day mission at 50% when it exceeds seven hours
- Return day at 30% when it exceeds seven hours
- Transportation as a separate amount
- Manual bonus or penalty during salary finalization
- Final total and a clear calculation breakdown

Return a breakdown, not only one number. The interface needs to explain how the amount was produced, and the backend needs the same information for auditing.

Money and time boundary rules must be confirmed before implementation. Tests should cover exactly seven hours, more than seven hours, invalid dates, zero-day trips, and rounding.

### 6. Add runtime schemas

TypeScript types disappear when the application runs. After the types are agreed upon, add Zod schemas for information received through the API.

Recommended future structure:

```text
shared/schemas/
├── UserSchema.ts
├── TravelRequestSchema.ts
└── WorkflowActionSchema.ts
```

The backend will use these schemas to reject invalid requests. The frontend can use the same schemas to validate forms before submission.

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
