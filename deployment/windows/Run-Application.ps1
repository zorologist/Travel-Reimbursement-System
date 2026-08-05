[CmdletBinding()]
param(
  [string]$AppRoot = "",
  [string]$NodePath = "node.exe"
)

$ErrorActionPreference = "Stop"
if (-not $AppRoot) { $AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }
$resolvedRoot = (Resolve-Path -LiteralPath $AppRoot).Path
$envFile = Join-Path $resolvedRoot ".env"
$serverFile = Join-Path $resolvedRoot "backend\dist\server.js"
$logDirectory = Join-Path $resolvedRoot "logs"

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) { throw "Missing production environment file: $envFile" }
if (-not (Test-Path -LiteralPath $serverFile -PathType Leaf)) { throw "Missing compiled backend: $serverFile" }
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

Set-Location -LiteralPath $resolvedRoot
$logFile = Join-Path $logDirectory ("application-" + (Get-Date -Format "yyyy-MM-dd") + ".log")
& $NodePath "--env-file=$envFile" $serverFile *>> $logFile
exit $LASTEXITCODE
