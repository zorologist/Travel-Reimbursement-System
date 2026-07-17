<!-- This guide divides backend development among four people with clear ownership and integration points. -->

# Backend Team Guide

This document divides the backend work among four people. Each person owns different files so the team can work at the same time with fewer merge conflicts.

## Shared Backend Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **API framework:** Express
- **Validation:** Zod
- **Development storage:** In-memory TypeScript data
- **Testing:** Vitest and Supertest
- **Data format:** JSON over HTTP

The real company database and authentication system will be connected later. During the first version, the team should use development users, requests, and company information only.

## Person 1 — API Setup and Authentication

### Files owned

```text
backend/src/app.ts
backend/src/server.ts
backend/src/routes/authRoutes.ts
backend/src/middleware/errorHandler.ts
backend/package.json
backend/tsconfig.json
```

### What they do

- Configure and start the Express server.
- Register all backend routers under `/api`.
- Configure JSON parsing and CORS.
- Create the central error handler.
- Implement temporary development sign-in.
- Return the signed-in user's identity and system role.
- Provide a health-check endpoint.

### Why this role exists

Every other backend feature needs a working server, consistent errors, and a known current user. This person owns the API foundation so the other team members do not configure Express differently in each feature.

### What they need from others

- The user structure and development users from Person 4.
- The request router from Person 2.
- The workflow router from Person 3.

### Skills needed

- TypeScript and Node.js
- Express routing and middleware
- HTTP status codes and JSON responses
- Basic authentication concepts
- Vitest and Supertest

## Person 2 — Travel Requests

### Files owned

```text
backend/src/routes/requestRoutes.ts
backend/src/services/requestService.ts
shared/types/TravelRequest.ts
```

### What they do

- Define the travel request structure.
- Create a new travel request.
- List requests for the signed-in employee.
- Retrieve one request by its ID.
- Allow an employee to correct a returned request.
- Validate dates, destination, accommodation, and required fields.
- Call the storage functions owned by Person 4 instead of editing arrays directly.

### Why this role exists

Travel requests are the main records in the system. Keeping their HTTP endpoints, validation, and business operations together makes the request lifecycle easier to understand and test.

### What they need from others

- Current-user information from Person 1.
- Workflow stages and transition results from Person 3.
- Storage functions and development records from Person 4.

### Skills needed

- TypeScript interfaces and types
- Express routers
- Zod validation
- REST API design
- Unit and API testing

## Person 3 — Workflow and Salary Rules

### Files owned

```text
backend/src/routes/workflowRoutes.ts
backend/src/services/workflowService.ts
backend/src/services/salaryService.ts
shared/types/Workflow.ts
shared/constants/salaryRates.ts
shared/salary/calculateSalary.ts
docs/WORKFLOW.md
docs/SALARY_RULES.md
```

### What they do

- Define every workflow stage in the correct order.
- Enforce which role can approve, reject, or edit at each stage.
- Prevent skipped stages and unauthorized actions.
- Define role-based daily salary rates.
- Implement accommodation, same-day, return-day, bonus, penalty, and transportation calculations.
- Recalculate the amount after relevant corrections.
- Lock the final amount after salary finalization.
- Write calculation tests for every business rule and boundary.

### Why this role exists

Workflow enforcement and salary calculations are the most sensitive business rules. One owner should keep these rules consistent, documented, and thoroughly tested rather than spreading the logic across routes or interface code.

### What they need from others

- The current user and role from Person 1.
- Request structures from Person 2.
- Request saving and audit-event functions from Person 4.
- Confirmed business rules from the project owner.

### Skills needed

- Strong TypeScript
- Pure-function design
- Business-rule modelling
- Numeric and date calculations
- Authorization concepts
- Table-driven unit testing with Vitest

## Person 4 — Development Data, Storage, and Audit Trail

### Files owned

```text
backend/src/data/company.ts
backend/src/data/users.ts
backend/src/data/requests.ts
backend/src/storage/memoryStore.ts
shared/types/User.ts
docs/DEVELOPMENT_DATA.md
```

### What they do

- Define the shared user structure and available system roles.
- Create safe development users for every department.
- Create example requests at different workflow stages.
- Store users, requests, and audit events in memory.
- Provide storage functions such as:
  - `findUserById`
  - `findRequestById`
  - `listRequests`
  - `createRequest`
  - `updateRequest`
  - `addAuditEvent`
- Return copies of records where needed so callers cannot silently modify stored information.
- Document how this temporary layer will later be replaced by the company database.

### Why this role exists

Routes and services should not directly manipulate arrays or depend on a future database. A separate storage layer gives the whole backend one predictable way to access information and makes the later database replacement much easier.

### What they need from others

- Request fields from Person 2.
- Workflow stages and audit-event requirements from Person 3.
- Authentication needs from Person 1.

### Skills needed

- TypeScript data modelling
- Arrays, maps, and immutable updates
- Repository or storage-layer design
- Test-data design
- Basic database concepts for future migration

## Rules for Working Together

1. Each person should mainly edit the files listed under their ownership.
2. Shared type changes must be discussed with everyone who consumes that type.
3. Routes handle HTTP input and output; they do not contain business rules.
4. Services contain business rules; they do not directly start the server.
5. Only the storage layer directly reads or changes stored records.
6. Salary calculations must remain pure and must not access Express or storage.
7. Each feature should include tests before it is considered complete.
8. Real employee information must never be placed in development data files.

## Recommended Integration Order

1. The four people first agree on `User`, `TravelRequest`, and `Workflow` shapes.
2. Person 4 creates development data and storage function signatures.
3. Person 1 finishes the server, error handling, and development sign-in.
4. Person 2 connects request routes to the storage layer.
5. Person 3 connects workflow and salary rules to requests and audit events.
6. The team adds all routers to `app.ts` and runs complete API tests.

## Completion Checklist

- The backend starts without errors.
- Development users can sign in.
- Employees can create and view requests.
- Requests follow the approval departments in order.
- Unauthorized roles cannot perform workflow actions.
- Salary calculations match all documented rules.
- Every change creates an audit event.
- Finalized requests cannot be changed.
- Restarting the backend safely resets development information.
