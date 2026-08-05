# Travel Reimbursement System — Study Roadmap

This is a living checklist. Update it whenever a project task is completed or a new concept is learned.

## Progress key

- `[x]` Completed or understood at a beginner level
- `[ ]` Still to learn or practise

## 1. Project foundations

- [x] Understand the basic flow: browser → web server → Node.js backend → PostgreSQL
- [x] Understand that Node.js runs the application logic
- [x] Understand that PostgreSQL permanently stores application data
- [x] Understand that the Vite development proxy forwards browser `/api` calls to Node.js
- [ ] Learn the repository folders and what each major file does
- [ ] Learn npm workspaces, `package.json`, and `package-lock.json`
- [ ] Learn environment variables and why `.env` must not be committed
- [ ] Run, test, build, and debug the entire project without assistance

## 2. PostgreSQL and SQL

- [x] Install PostgreSQL 18 and pgAdmin
- [x] Understand server, database, role/user, schema, table, row, and column
- [x] Understand the basic difference between PostgreSQL and MySQL
- [x] Connect pgAdmin to PostgreSQL 18 on local port `5433`
- [x] Create the `travel_app` login role
- [x] Create and correctly name the `travel_reimbursement` database
- [x] Assign `travel_app` as the database owner
- [x] Configure local database environment variables without exposing the password
- [x] Learn that `#` inside an `.env` password must be protected with quotes
- [x] Apply the first database migration
- [x] Seed fictional development users without enabling them in production
- [x] Connect the backend user lookup to PostgreSQL and verify a real local login
- [x] Understand that migrations create structure while seeds add starting data
- [x] Submit a real request, restart Node.js, and prove PostgreSQL retained it
- [ ] Learn basic SQL: `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
- [ ] Learn keys, relationships, constraints, indexes, sequences, and transactions
- [ ] Practise backing up and restoring the database
- [ ] Learn how the application maps TypeScript objects to database rows

## 3. Backend and API

- [ ] Learn TypeScript fundamentals
- [ ] Learn Node.js and Express fundamentals
- [ ] Understand routes, middleware, services, validation, and storage adapters
- [x] Implement the first PostgreSQL storage adapter and asynchronous storage boundary
- [ ] Replace runtime in-memory data with PostgreSQL storage
- [ ] Store users, roles, travel requests, audit events, revisions, and sessions
- [ ] Learn REST and HTTP methods/status codes
- [ ] Learn error handling, logging, health checks, and automated tests

## 4. Frontend

- [ ] Learn HTML, CSS, JavaScript, TypeScript, and React fundamentals
- [ ] Understand components, props, state, hooks, forms, and routing
- [ ] Understand how the frontend calls the backend API
- [ ] Learn loading, empty, success, validation, and error states
- [ ] Rebuild one project screen independently

## 5. Active Directory and authentication

- [x] Understand that the application must never collect or store AD passwords
- [x] Understand the planned flow: IIS verifies Kerberos/Windows identity, then forwards the verified username to Node.js
- [ ] Learn AD, domain, domain controller, DNS, LDAP, Kerberos, SPN, service account, and gMSA
- [ ] Confirm the exact trusted identity header and IIS protection rules with company IT
- [ ] Map verified AD usernames to application users and roles
- [x] Add separate development and production IIS/Kerberos authentication modes
- [x] Test accepted, missing, unknown, and password-login-disabled identity cases

## 6. Windows deployment

- [ ] Learn Windows service basics and how Node.js will run after reboot
- [ ] Build a production package that does not require internet access
- [x] Configure Node.js to serve the built React frontend and API from one internal port
- [ ] Install the application and create production `.env` configuration
- [ ] Create the production PostgreSQL role, database, and schema
- [ ] Run Node.js internally on port `5435`
- [ ] Enable and configure IIS as the public reverse proxy
- [ ] Configure Windows Authentication/Kerberos with company IT
- [ ] Configure DNS, HTTPS certificate, firewall rules, and file permissions
- [ ] Verify logging, backups, restart behavior, and rollback procedure

## 7. Final acceptance checks

- [ ] Employee identity is correct and cannot be impersonated
- [ ] Every department sees only its correct work queue
- [ ] A request completes the full workflow successfully
- [x] Data remains after restarting Node.js
- [ ] Data remains after restarting PostgreSQL
- [ ] Unauthorized access and invalid input are rejected
- [ ] Database backup and restore are tested
- [ ] The application works from another company-domain computer using its DNS name
