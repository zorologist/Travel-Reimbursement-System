[CmdletBinding()]
param(
  [string]$ArchivePath = "",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$releaseRoot = Join-Path $projectRoot "release"
if (-not $ArchivePath) { $ArchivePath = Join-Path $releaseRoot "Travel-Reimbursement-System-offline.tar.gz" }
$fullArchivePath = [IO.Path]::GetFullPath($ArchivePath)
if (-not $fullArchivePath.StartsWith([IO.Path]::GetFullPath($releaseRoot), [StringComparison]::OrdinalIgnoreCase)) {
  throw "ArchivePath must stay inside $releaseRoot"
}

Set-Location -LiteralPath $projectRoot
if (-not $SkipBuild) {
  & npm.cmd run build:company
  if ($LASTEXITCODE -ne 0) { throw "Company production build failed." }
}
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
if (Test-Path -LiteralPath $fullArchivePath) {
  $backup = "$fullArchivePath.previous-$(Get-Date -Format yyyyMMdd-HHmmss)"
  Move-Item -LiteralPath $fullArchivePath -Destination $backup
}

$items = @(
  "package.json", "package-lock.json",
  "backend/dist", "backend/migrations", "backend/package.json",
  "frontend/dist", "shared/dist", "shared/package.json",
  "deployment", "node_modules"
)
& tar.exe -czf $fullArchivePath `
  --exclude="node_modules/backend" `
  --exclude="node_modules/frontend" `
  --exclude="node_modules/@travel-reimbursement/shared" `
  @items
if ($LASTEXITCODE -ne 0) { throw "tar failed with exit code $LASTEXITCODE." }

$hash = Get-FileHash -LiteralPath $fullArchivePath -Algorithm SHA256
[IO.File]::WriteAllText("$fullArchivePath.sha256", "$($hash.Hash)  $([IO.Path]::GetFileName($fullArchivePath))`r`n")
& tar.exe -tzf $fullArchivePath | Select-Object -First 5 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Archive verification failed." }
Write-Output "Offline archive ready: $fullArchivePath"
Write-Output "SHA256: $($hash.Hash)"
