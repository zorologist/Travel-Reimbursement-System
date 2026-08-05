[CmdletBinding()]
param([string]$AppRoot = "")

$ErrorActionPreference = "Stop"
if (-not $AppRoot) { $AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
$resolvedRoot = (Resolve-Path -LiteralPath $AppRoot).Path
$sharedSource = Join-Path $resolvedRoot "shared"
$sharedTarget = Join-Path $resolvedRoot "node_modules\@travel-reimbursement\shared"
if (-not (Test-Path -LiteralPath (Join-Path $sharedSource "dist\index.js"))) { throw "Shared compiled package is missing." }
New-Item -ItemType Directory -Path $sharedTarget -Force | Out-Null
& robocopy.exe $sharedSource $sharedTarget /E /XJ /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -gt 7) { throw "Failed to reconstruct @travel-reimbursement/shared." }

$envTemplate = Join-Path $resolvedRoot "deployment\templates\production.env.template"
$envFile = Join-Path $resolvedRoot ".env"
if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envTemplate -Destination $envFile
  Write-Output "Created .env from the production template. Complete it before starting the app."
} else {
  Write-Output "Existing .env preserved."
}
& node.exe --check (Join-Path $resolvedRoot "backend\dist\server.js")
if ($LASTEXITCODE -ne 0) { throw "Packaged backend failed JavaScript syntax validation." }
Write-Output "Extracted package prepared: $resolvedRoot"
