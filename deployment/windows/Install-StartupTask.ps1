[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$AppRoot = "",
  [string]$TaskName = "EGAS Travel Reimbursement",
  [string]$RunAs = "NT AUTHORITY\NETWORK SERVICE"
)

$ErrorActionPreference = "Stop"
if (-not $AppRoot) { $AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }
$isAdministrator = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdministrator) { throw "Run PowerShell as Administrator." }

$resolvedRoot = (Resolve-Path -LiteralPath $AppRoot).Path
$runScript = Join-Path $resolvedRoot "deployment\windows\Run-Application.ps1"
$envFile = Join-Path $resolvedRoot ".env"
$serverFile = Join-Path $resolvedRoot "backend\dist\server.js"
$node = Get-Command node.exe -ErrorAction Stop
if (-not (Test-Path -LiteralPath $runScript -PathType Leaf)) { throw "Missing runner: $runScript" }
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) { throw "Create and complete $envFile before installing the task." }
if (-not (Test-Path -LiteralPath $serverFile -PathType Leaf)) { throw "Missing compiled backend: $serverFile" }

$logs = Join-Path $resolvedRoot "logs"
New-Item -ItemType Directory -Path $logs -Force | Out-Null
& icacls.exe $resolvedRoot /grant "${RunAs}:(OI)(CI)RX" /T /C | Out-Null
& icacls.exe $logs /grant "${RunAs}:(OI)(CI)M" /T /C | Out-Null

$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$runScript`" -AppRoot `"$resolvedRoot`" -NodePath `"$($node.Source)`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments -WorkingDirectory $resolvedRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId $RunAs -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

if ($PSCmdlet.ShouldProcess($TaskName, "Register and start startup task")) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
  Start-ScheduledTask -TaskName $TaskName
  Write-Output "Installed and started '$TaskName'. Logs: $logs"
}
