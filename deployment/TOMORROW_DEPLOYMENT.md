# Tomorrow: Company Deployment Runbook

Use this file in order. Do not put real passwords in chat, Git, screenshots, or the employee CSV.

## Values to get from IT before changing IIS

- Final application DNS name (placeholder used here: `travel.egas.local`)
- Confirmation that this Windows 10 VM is an approved permanent host
- Approved PostgreSQL port (template currently uses `5433`)
- Employee export with the columns in `deployment/templates/employees.csv`
- Permission/installers for IIS URL Rewrite and Application Request Routing (ARR)
- HTTPS certificate thumbprint for the final DNS name
- Kerberos SPN owner: computer account, normal service account, or gMSA
- Permission for IT to create the DNS record and SPN

## 1. Copy the offline package

Copy `Travel-Reimbursement-System-offline.tar.gz` and its `.sha256` file to the server. Then extract it:

```powershell
New-Item -ItemType Directory C:\Apps\Travel-Reimbursement-System -Force
tar.exe -xzf D:\Path\Travel-Reimbursement-System-offline.tar.gz -C C:\Apps\Travel-Reimbursement-System
Set-Location C:\Apps\Travel-Reimbursement-System
.\deployment\Prepare-ExtractedPackage.ps1
```

Open **PowerShell as Administrator**, then:

```powershell
Set-Location C:\Apps\Travel-Reimbursement-System
node --version
psql --version
```

If `psql` is not found, PostgreSQL may be missing or its `bin` directory is not in `PATH`. Typical location:

```text
C:\Program Files\PostgreSQL\18\bin
```

## 2. Create the production `.env`

```powershell
Copy-Item .env.template .env
notepad .env
```

Replace:

- `travel.egas.local` with the approved DNS name
- `DATABASE_PORT` with the actual PostgreSQL port
- `DATABASE_PASSWORD="CHANGE_ON_SERVER"` with the new `travel_app` password

Keep the quotes when the password contains `#`, spaces, or punctuation. Confirm these exact production values:

```text
NODE_ENV=production
AUTH_MODE=iis
ENABLE_DEVELOPMENT_ACCOUNTS=false
ALLOW_DEV_AUTH_HEADER=false
STORAGE_MODE=postgres
SERVE_FRONTEND=true
HOST=127.0.0.1
PORT=5435
```

Check that no placeholder remains:

```powershell
Select-String -Path .env -SimpleMatch CHANGE_ON_SERVER
```

The command must return nothing.

## 3. Create the PostgreSQL role and database

Use the same application password you entered in `.env`:

```powershell
$adminPassword = Read-Host "PostgreSQL postgres password" -AsSecureString
$appPassword = Read-Host "New travel_app password" -AsSecureString
.\deployment\database\Initialize-Database.ps1 -AdminPassword $adminPassword -AppPassword $appPassword -Port 5433
```

If PostgreSQL is not on `5433`, replace the port everywhere, including `.env`.

Apply the schema and verify connectivity:

```powershell
npm.cmd run db:migrate:prod --workspace backend
npm.cmd run db:check:prod --workspace backend
```

## 4. Import employees

Replace the sample CSV with the approved IT export. Required headers:

```text
windows_username,user_principal_name,employee_number,display_name,email,department,job_level,roles,active
```

Allowed roles:

```text
employee|manager|pr|transportation|timing|salary
```

First run preview only:

```powershell
npm.cmd run db:import-users:prod --workspace backend -- C:\Path\employees.csv
```

If counts look correct, apply it:

```powershell
npm.cmd run db:import-users:prod --workspace backend -- C:\Path\employees.csv --apply
```

Only use `--disable-missing` after IT confirms the CSV is a complete authoritative employee list. It disables database users omitted from the file.

## 5. Install automatic Node startup

```powershell
.\deployment\windows\Install-StartupTask.ps1 -AppRoot C:\Apps\Travel-Reimbursement-System
Invoke-RestMethod http://127.0.0.1:5435/api/health
```

Expected:

```json
{"status":"ok","storage":"postgres"}
```

Logs are written under `C:\Apps\Travel-Reimbursement-System\logs`.

## 6. Configure IIS with IT

Do not continue without the approved URL Rewrite and ARR installers. Then run:

```powershell
.\deployment\iis\Configure-IIS.ps1 -HostName travel.egas.local
```

If IT already installed the HTTPS certificate:

```powershell
.\deployment\iis\Configure-IIS.ps1 -HostName travel.egas.local -CertificateThumbprint "CERTIFICATE_THUMBPRINT"
```

The script enables IIS Windows Authentication, disables Anonymous Authentication, proxies to `127.0.0.1:5435`, and overwrites `X-IIS-Windows-User` with IIS's verified `{LOGON_USER}` value.

IT must then:

1. Create the DNS record.
2. Register/verify the `HTTP/travel.egas.local` Kerberos SPN on the correct AD account.
3. Confirm the HTTPS certificate chain is trusted by employee computers.
4. Keep port `5435` inaccessible remotely; Node listens only on loopback anyway.

## 7. Verify

```powershell
.\deployment\Verify-Deployment.ps1 -AppRoot C:\Apps\Travel-Reimbursement-System
```

From a separate domain computer, browse to the HTTPS DNS name. Test:

- Known employee signs in automatically
- Unknown/disabled employee receives access denied
- Employee sees only their requests
- Manager sees only requests assigned to that manager
- PR, Transportation, Timing, and Salary queues are correct
- A submitted request survives a Node restart and PostgreSQL restart

## Backup immediately after acceptance

```powershell
$appPassword = Read-Host "travel_app password" -AsSecureString
.\deployment\database\Backup-Database.ps1 -Password $appPassword -Port 5433
```

Copy the backup to the IT-approved protected backup location.

## Safe rollback

To stop the application without deleting data:

```powershell
Stop-ScheduledTask -TaskName "EGAS Travel Reimbursement"
Stop-Website -Name "EGAS Travel Reimbursement"
```

The PostgreSQL database remains intact. Do not delete the application folder or database during troubleshooting.
