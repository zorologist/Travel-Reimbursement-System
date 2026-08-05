[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
  [Parameter(Mandatory)][string]$BackupFile,
  [string]$Database = "travel_reimbursement",
  [Parameter(Mandatory)][string]$ConfirmDatabaseName,
  [string]$HostName = "localhost",
  [int]$Port = 5435,
  [string]$User = "postgres",
  [Parameter(Mandatory)][SecureString]$Password,
  [string]$PgRestorePath = "pg_restore.exe"
)

$ErrorActionPreference = "Stop"
if ($ConfirmDatabaseName -cne $Database) { throw "ConfirmDatabaseName must exactly match '$Database'." }
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($PSCmdlet.ShouldProcess("$HostName`:$Port/$Database", "Restore and overwrite database objects from $resolvedBackup")) {
    & $PgRestorePath --host=$HostName --port=$Port --username=$User --dbname=$Database --clean --if-exists --no-owner $resolvedBackup
    if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE." }
    Write-Output "Database restore completed: $Database"
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
