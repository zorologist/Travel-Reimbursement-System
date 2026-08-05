[CmdletBinding()]
param(
  [string]$AppRoot = "",
  [string]$HealthUrl = "http://127.0.0.1:3000/api/health",
  [string]$TaskName = "EGAS Travel Reimbursement"
)

$ErrorActionPreference = "Stop"
if (-not $AppRoot) { $AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
$resolvedRoot = (Resolve-Path -LiteralPath $AppRoot).Path
$envFile = Join-Path $resolvedRoot ".env"
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) { throw "Missing $envFile" }
if (Select-String -LiteralPath $envFile -SimpleMatch "CHANGE_ON_SERVER" -Quiet) { throw ".env still contains CHANGE_ON_SERVER." }
if (-not (Test-Path -LiteralPath (Join-Path $resolvedRoot "backend\dist\server.js"))) { throw "Compiled backend is missing." }
if (-not (Test-Path -LiteralPath (Join-Path $resolvedRoot "frontend\dist\index.html"))) { throw "Compiled frontend is missing." }
Get-Command node.exe -ErrorAction Stop | Out-Null

Push-Location (Join-Path $resolvedRoot "backend")
try {
  & node.exe "--env-file=../.env" "dist/database/check.js"
  if ($LASTEXITCODE -ne 0) { throw "Database verification failed." }
} finally {
  Pop-Location
}

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) { Write-Output "Startup task: $($task.State)" }
else { Write-Warning "Startup task '$TaskName' is not installed yet." }

$health = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 10
if ($health.status -ne "ok" -or $health.storage -ne "postgres") {
  throw "Unexpected health response: $($health | ConvertTo-Json -Compress)"
}
Write-Output "Direct Node health: ok, PostgreSQL connected."
Write-Output "Deployment verification passed. IIS/Kerberos/DNS/HTTPS still require a domain-computer test."
