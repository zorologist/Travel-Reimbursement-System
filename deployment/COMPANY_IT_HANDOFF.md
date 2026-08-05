# EGAS Travel Reimbursement — IT Handoff

## Requested deployment model

The application is an internal React/Node.js/PostgreSQL system. The requested production path is:

```text
Domain workstation
  → HTTPS DNS name
  → IIS Windows Authentication (Negotiate/Kerberos)
  → IIS reverse proxy on the same host
  → Node.js at 127.0.0.1:5435
  → local PostgreSQL
```

Node.js is deliberately bound to loopback. Clients must not connect directly to port `5435`.

## Authentication contract

- IIS performs Windows Authentication.
- Anonymous Authentication is disabled for this site.
- IIS overwrites `X-IIS-Windows-User` using `{LOGON_USER}`.
- Node trusts this header only when the TCP peer is an approved loopback address.
- Node maps `DOMAIN\sAMAccountName` or `userPrincipalName` to an active local application record.
- The application does not request, receive, verify, or store Active Directory passwords.
- Unknown and inactive directory identities receive access denied.

## Requested IT actions/decisions

1. Approve the Windows host for production use.
2. Confirm/install IIS Windows Authentication, URL Rewrite, and ARR.
3. Assign the final DNS name (placeholder: `travel.egas.local`).
4. Create the internal DNS record pointing to the IIS host.
5. Supply/install an internally trusted HTTPS certificate for that DNS name.
6. Decide the IIS application-pool identity: computer identity, service account, or gMSA.
7. Register and verify the `HTTP/<dns-name>` SPN on the identity selected by IT; prevent duplicate SPNs.
8. Provide an approved user export using `deployment/templates/employees.csv`.
9. Confirm the PostgreSQL port and backup destination.
10. Confirm that ports 80/443 are reachable as required and port 5435 remains non-public.

## Employee import columns

```text
windows_username
user_principal_name
employee_number
display_name
email
department
job_level
roles
active
```

Application roles are explicit and do not grant AD permissions:

```text
employee, manager, pr, transportation, timing, salary
```

Multiple roles in CSV use `|`, for example `employee|manager`.

## Acceptance evidence requested

- Browser developer tools show no username/password submitted to the application.
- IIS logs show authenticated Windows usernames.
- Node health reports PostgreSQL connected and the applied schema version.
- A known active employee signs in automatically.
- Unknown and inactive accounts are denied.
- A request survives Node, PostgreSQL, and host restarts.
- Backup and test restore complete successfully.
- Direct remote access to `127.0.0.1:5435` is impossible by design.
