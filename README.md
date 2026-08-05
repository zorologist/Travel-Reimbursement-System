# EGAS Travel Reimbursement System

Internal travel-request workflow for employees, managers, Public Relations, Transportation, Timing and Salary/Payroll.

## Architecture

```text
Employee browser
  → IIS HTTPS + Windows Authentication/Kerberos
  → verified X-IIS-Windows-User header
  → Node.js/Express on 127.0.0.1:5435
  → PostgreSQL
```

The production application never collects or stores Active Directory passwords. IIS authenticates the Windows user; Node maps that verified username to an active PostgreSQL user and application roles.

## Technology

- React + TypeScript frontend
- Node.js + Express backend
- PostgreSQL 18 database
- IIS reverse proxy with Windows Authentication/Kerberos
- npm workspaces for `shared`, `frontend`, and `backend`

## Local development

Requirements: Node.js, npm, and PostgreSQL.

1. Copy `.env.example` to `.env` and enter the local database password.
2. Apply migrations and seed fictional development users:

```powershell
npm.cmd run build -w backend
npm.cmd run db:migrate:prod --workspace backend
npm.cmd run db:seed:dev:prod --workspace backend
```

3. Start the application:

```powershell
npm.cmd run dev
```

4. Open `http://localhost:5173`.

The fictional `DEV001`–`DEV010` accounts are for local development only and are blocked when `NODE_ENV=production`.

## Verification commands

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run db:check:prod --workspace backend
```

## Database lifecycle

- Migrations: `backend/migrations`
- Migration runner: `backend/src/database/migrate.ts`
- Employee CSV template: `deployment/templates/employees.csv`
- Preview employee import:

```powershell
npm.cmd run db:import-users:prod --workspace backend -- deployment/templates/employees.csv
```

- Apply an approved import:

```powershell
npm.cmd run db:import-users:prod --workspace backend -- C:\Path\employees.csv --apply
```

Do not use `--disable-missing` unless IT confirms the CSV is a complete authoritative employee list.

## Production build and deployment

Build the IIS/Kerberos frontend and compiled backend:

```powershell
npm.cmd run build:company
```

Create the offline folder containing compiled code, dependencies, templates and deployment scripts:

```powershell
.\deployment\New-OfflinePackage.ps1
```

The output is a compressed archive under `release/` and contains no `.env` file or real password.

Follow [deployment/TOMORROW_DEPLOYMENT.md](deployment/TOMORROW_DEPLOYMENT.md) in order on the company host.

## Security rules

- Node binds only to loopback in production; users reach IIS, never port `5435`.
- IIS overwrites the trusted Windows-identity header.
- Production configuration requires IIS authentication and PostgreSQL storage.
- Development accounts and development identity headers must remain disabled in production.
- Session cookies are HTTP-only, same-site and secure under production HTTPS.
- Mutating browser requests require a session-bound CSRF token.
- Audit and price-revision histories are append-only in PostgreSQL.
- `.env`, logs, backups and generated release folders must not be committed.

## Study roadmap

Learning progress and remaining topics are tracked in [STUDY_ROADMAP.md](STUDY_ROADMAP.md).
