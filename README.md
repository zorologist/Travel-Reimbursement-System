# Travel Reimbursement & Salary Management System

## Overview
This system is a digital workflow designed to replace slow, error-prone manual paperwork for employee travel requests. It automates submissions, enforces a strict multi-department approval sequence, calculates exact salary payouts based on job levels, and maintains an immutable audit trail to prevent fraud.

If you are writing code for this repository, this document outlines the exact business logic and mathematical formulas you must follow.

---

## The 5-Stage Workflow

Requests cannot skip steps. They must flow sequentially through the following departments:

1. **Employee Submission:** Employee selects destination (for transport), dates, role, and accommodation. The system generates an immediate live salary preview.
2. **Manager Review:** Approves the business need for the trip. A rejection sends it back to the employee.
3. **PR Department:** Verifies accommodation. If the employee lied about their hotel or meals, PR edits this field and the system auto-recalculates the payout.
4. **Transportation:** Verifies travel method. Calculates the transportation cost based on the destination city and verifies ticket receipts.
5. **Timing:** Cross-references submitted dates/times with physical entry logs to ensure the employee actually traveled.
6. **Salary Finalization:** Reviews the complete audit trail (Pre-edit vs. Post-edit differences), applies any manual bonuses/penalties, and locks the final amount for Finance.

---

## The Salary Calculation Engine (Strict Business Rules)

The base salary is **strictly role-based**, not city-based. The destination city is only used to calculate the transportation allowance.

### 1. Base Daily Allowance by Job Level
* **Chairman / Deputy / Advisor / Expert:** 270 EGP/night
* **Assistant / Deputy Assistant:** 240 EGP/night
* **General Manager / Asst. General Manager:** 200 EGP/night
* **Level 1:** 140 EGP/night
* **Level 2:** 110 EGP/night
* **Level 3:** 60 EGP/night

### 2. Accommodation Deductions
If the company provides accommodation, the daily allowance is reduced:
* **Accommodation Only (Room provided, no food):** 25% deduction (Employee receives 75% of their daily rate).
* **Full Accommodation (Room + Food provided):** 50% deduction (Employee receives 50% of their daily rate).

### 3. Special Day Rules
* **Same-Day Mission (No overnight stay):** Employee receives 50% of their base allowance (Condition: must exceed 7 hours of work).
* **Return Day:** The final day of travel returning from an overnight stay is calculated at strictly 30% of the daily rate (Condition: must exceed 7 hours).

### 4. Transportation
Transportation costs are isolated from the daily allowance. They are calculated based on the destination city and the method of travel (e.g., Company vehicle = 0 cost, Personal vehicle = Ticket cost).

---

## Architecture & Tech Stack

This is a strict monorepo. Keep your concerns separated.
* **Frontend:** React + TypeScript + Vite
* **Backend:** Node.js + Express
* **Shared:** TypeScript interfaces and pricing constants

```text
Travel-Reimbursement-System/
├── frontend/       # React UI, Form logic, Live calculation previews
├── backend/        # Express API, Workflow enforcement, Immutable math engine
├── shared/         # Pricing rules (Job Level Rates) and types used by both environments
└── docs/           # Extended API and Database documentation
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
