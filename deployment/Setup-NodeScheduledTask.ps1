# Registers the backend as a Windows Scheduled Task so it starts
# automatically at boot and restarts itself if it ever crashes, instead of
# depending on an open PowerShell window.
#
# Run this once, as Administrator, on the application server.

$ErrorActionPreference = "Stop"

$AppRoot = "C:\Travel-Reimbursement-Deployment-2026-08-03"
$BackendDir = Join-Path $AppRoot "backend"
$TaskName = "EGAS Travel Reimbursement Backend"

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw "node.exe was not found on PATH. Install Node.js or fix PATH before running this script."
}
$nodePath = $nodeCommand.Source

if (-not (Test-Path (Join-Path $BackendDir "dist\server.js"))) {
    throw "backend\dist\server.js was not found under $BackendDir. Deploy the backend build before running this script."
}

$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument '--env-file=../.env dist/server.js' `
    -WorkingDirectory $BackendDir

$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

# Runs as SYSTEM so it starts at boot without anyone being logged in.
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "Task '$TaskName' already exists - replacing it."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null

Write-Host "Task '$TaskName' registered. Starting it now..."
Start-ScheduledTask -TaskName $TaskName

Start-Sleep -Seconds 3
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
Write-Host ""
Write-Host "Verify Node is actually listening:"
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
