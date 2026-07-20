# Shared Package

This folder contains shared code used by both the frontend and backend applications. It defines common types, constants, schemas, and pure business logic to ensure consistency across the system.

## Folder Structure

- `constants/`: Fixed values like salary rates and transportation rates.
- `salary/`: Pure functions for business logic (e.g., salary calculation) and their tests.
- `schemas/`: Zod schemas for runtime validation.
- `types/`: TypeScript interfaces and types.

## Key Features

- **Workspace package**: Installed in both applications as `@travel-reimbursement/shared`.
- **Single public entry point**: Stable implemented exports are available from the package root.
- **Pure Logic**: All calculations are deterministic and have no side effects.
- **TypeScript**: Fully typed interfaces for all data structures.
- **Validation**: Zod schemas matching TypeScript types for API and form validation.
- **Testing**: Comprehensive test coverage using Vitest.

## Importing Shared Code

Frontend and backend code should import stable shared exports from the package root:

```ts
import {
  TravelRequestSchema,
  calculateSalary,
  type TravelRequest,
  type WorkflowStage,
} from "@travel-reimbursement/shared";
```

Do not use repository-relative paths such as `../../../shared/...`. The package also retains documented subpath exports for targeted imports, but the root entry point is the default application-facing API.

Authentication, API envelopes, attachments, request actions, workflow, salary, and price-revision contracts are exported from the package root.

## Calculation Rules

1. **Daily Rate**: Based on employee job level.
2. **Overnight Missions**:
   - Allowance = `Daily Rate * Overnight Count * Accommodation Factor`.
   - Return Day: If verified hours >= 7, adds 30% of Daily Rate (not subject to accommodation factor).
3. **Same-Day Missions**:
   - If verified hours >= 7, allowance = 50% of Daily Rate.
4. **Rounding**: All monetary values are rounded to two decimal places.
5. **Validation**: Negative values for counts, costs, or hours are rejected.
