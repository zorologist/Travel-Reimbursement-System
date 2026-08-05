[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param([string]$TaskName = "EGAS Travel Reimbursement")

$ErrorActionPreference = "Stop"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Output "Task '$TaskName' is not installed."
  exit 0
}
if ($PSCmdlet.ShouldProcess($TaskName, "Stop and unregister startup task")) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Output "Removed '$TaskName'. Application files and database were not deleted."
}
