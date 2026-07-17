<!-- This is the main project guide so new developers can quickly understand and run the system. -->

# Travel Reimbursement System

A simple travel request and reimbursement workflow built with React, Express, and TypeScript.

The project will initially use temporary development information and in-memory storage. No real employee information or company database is required during development.

## Project Structure

```text
frontend/   React user interface
backend/    Express API and temporary development storage
shared/     Types, salary rates, and calculations used by both sides
docs/       Short explanations of workflow, salary rules, and development data
```

## Workflow

An employee submits a travel request. It then moves through five departments in order:

1. Manager
2. PR
3. Transportation
4. Timing
5. Salary

Requests cannot skip a department. Rejections return the request for correction, and changes are recorded in the audit trail.

## Salary Rules

Daily rates are based on the employee's job level:

| Job level | Daily rate |
| --- | ---: |
| Chairman, Deputy, Advisor, Expert | 270 EGP |
| Assistant, Deputy Assistant | 240 EGP |
| General Manager, Assistant General Manager | 200 EGP |
| Level 1 | 140 EGP |
| Level 2 | 110 EGP |
| Level 3 | 60 EGP |

- Accommodation only: deduct 25%.
- Accommodation with food: deduct 50%.
- Same-day mission longer than seven hours: pay 50% of the daily rate.
- Return day longer than seven hours: pay 30% of the daily rate.
- Transportation is calculated separately.

## Development Data

Temporary users, requests, and company details will live in `backend/src/data/`. The in-memory store will live in `backend/src/storage/memoryStore.ts` and reset whenever the backend restarts.

When the company is ready, temporary storage can be replaced with a real database while keeping the workflow and user interface intact.

## Running Locally

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

See `docs/` for focused project notes.
