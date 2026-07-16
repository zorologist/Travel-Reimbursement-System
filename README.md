
# Travel Reimbursement & Salary Management System

Welcome to the digital workflow that replaces manual paperwork, auto-calculates travel salaries, and keeps a complete audit trail so nobody can lie about their hotel expenses.[cite: 2]

With 9 developers touching this codebase, this README is the law. Read it before you break the build.

## The Tech Stack
* **Frontend:** React + TypeScript + Vite (Fast, no Webpack bloat)
* **Backend:** Node.js + Express (The math and API engine)
* **Architecture:** Monorepo (Single source of truth)

---

## Detailed Project Structure
We are running a strict monorepo. Keep your frontend code out of the backend, and vice versa.

```text
Travel-Reimbursement-System/
├── frontend/               # React UI, Forms, Admin Dashboards
│   ├── src/components/     # UI elements (Split into Employee, Admin, Shared)
│   ├── src/services/       # API call wrappers (Do not use raw fetch in components)
│   └── src/pages/          # Main route views
├── backend/                # Express API, DB schemas, Salary calculation engine
│   ├── src/routes/         # API endpoints (/api/workflow/pr-approve)
│   ├── src/controllers/    # Route logic and validation
│   ├── src/services/       # Business logic (5-stage approval sequence, salary math)
│   └── src/database/       # SQL schemas and DB connection
├── shared/                 # TypeScript types & pricing rules shared by both sides
└── docs/                   # API specs and core business logic
