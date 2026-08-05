[CmdletBinding()]
param(
  [string]$Database = "travel_reimbursement",
  [string]$AppUser = "travel_app",
  [string]$HostName = "localhost",
  [int]$Port = 5433,
  [string]$AdminUser = "postgres",
  [Parameter(Mandatory)][SecureString]$AdminPassword,
  [Parameter(Mandatory)][SecureString]$AppPassword,
  [string]$PsqlPath = "psql.exe",
  [string]$CreatedbPath = "createdb.exe"
)

$ErrorActionPreference = "Stop"
if ($Database -notmatch '^[a-z][a-z0-9_]*$') { throw "Database must contain only lowercase letters, numbers and underscores." }
if ($AppUser -notmatch '^[a-z][a-z0-9_]*$') { throw "AppUser must contain only lowercase letters, numbers and underscores." }

$adminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($AdminPassword)
$appPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($AppPassword)
$tempSql = Join-Path ([IO.Path]::GetTempPath()) ("travel-db-" + [guid]::NewGuid().ToString("N") + ".sql")
try {
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($adminPointer)
  $plainAppPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($appPointer)
  $escapedPassword = $plainAppPassword.Replace("'", "''")
  $roleSql = @"
DO `$role`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AppUser') THEN
    CREATE ROLE "$AppUser" LOGIN;
  END IF;
END
`$role`$;
ALTER ROLE "$AppUser" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '$escapedPassword';
"@
  [IO.File]::WriteAllText($tempSql, $roleSql, [Text.UTF8Encoding]::new($false))
  & $PsqlPath --host=$HostName --port=$Port --username=$AdminUser --dbname=postgres --set=ON_ERROR_STOP=1 --file=$tempSql
  if ($LASTEXITCODE -ne 0) { throw "Failed to create or update PostgreSQL application role." }

  $databaseExists = & $PsqlPath --host=$HostName --port=$Port --username=$AdminUser --dbname=postgres --tuples-only --no-align --command="SELECT 1 FROM pg_database WHERE datname='$Database'"
  if ($LASTEXITCODE -ne 0) { throw "Failed to check whether the database exists." }
  $databaseExistsText = ($databaseExists | Out-String).Trim()
  if ($databaseExistsText -ne "1") {
    & $CreatedbPath --host=$HostName --port=$Port --username=$AdminUser --owner=$AppUser --encoding=UTF8 $Database
    if ($LASTEXITCODE -ne 0) { throw "Failed to create database '$Database'." }
    Write-Output "Created database '$Database' owned by '$AppUser'."
  } else {
    & $PsqlPath --host=$HostName --port=$Port --username=$AdminUser --dbname=postgres --set=ON_ERROR_STOP=1 --command="ALTER DATABASE `"$Database`" OWNER TO `"$AppUser`";"
    if ($LASTEXITCODE -ne 0) { throw "Failed to confirm database ownership." }
    Write-Output "Database '$Database' already exists; ownership set to '$AppUser'."
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempSql -Force -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPointer)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($appPointer)
}
