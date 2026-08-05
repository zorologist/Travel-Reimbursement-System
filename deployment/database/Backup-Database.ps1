[CmdletBinding()]
param(
  [string]$Database = "travel_reimbursement",
  [string]$HostName = "localhost",
  [int]$Port = 5433,
  [string]$User = "travel_app",
  [Parameter(Mandatory)][SecureString]$Password,
  [string]$BackupDirectory = "",
  [string]$PgDumpPath = "pg_dump.exe"
)

$ErrorActionPreference = "Stop"
if (-not $BackupDirectory) { $BackupDirectory = Join-Path $PSScriptRoot "backups" }
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
$resolvedBackupDirectory = (Resolve-Path -LiteralPath $BackupDirectory).Path
$backupFile = Join-Path $resolvedBackupDirectory ("${Database}_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".backup")
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  & $PgDumpPath --host=$HostName --port=$Port --username=$User --format=custom --file=$backupFile $Database
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE." }
  Write-Output "Database backup created: $backupFile"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
