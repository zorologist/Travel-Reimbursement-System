[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$SiteName = "EGAS Travel Reimbursement",
  [string]$HostName = "travel.egas.local",
  [string]$ProxyPhysicalPath = "",
  [string]$CertificateThumbprint = ""
)

$ErrorActionPreference = "Stop"
if (-not $ProxyPhysicalPath) { $ProxyPhysicalPath = $PSScriptRoot }
$isAdministrator = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdministrator) { throw "Run PowerShell as Administrator." }

Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole,IIS-WebServer,IIS-Security,IIS-WindowsAuthentication,IIS-ManagementConsole -All -NoRestart | Out-Null
Import-Module WebAdministration

if (-not (Get-WebGlobalModule | Where-Object Name -eq "RewriteModule")) {
  throw "IIS URL Rewrite is not installed. IT must install the approved offline URL Rewrite package, then rerun this script."
}
try {
  Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "enabled" -ErrorAction Stop | Out-Null
} catch {
  throw "IIS Application Request Routing (ARR) is not installed. IT must install the approved offline ARR package, then rerun this script."
}

$resolvedProxyPath = (Resolve-Path -LiteralPath $ProxyPhysicalPath).Path
$webConfig = Join-Path $resolvedProxyPath "web.config"
if (-not (Test-Path -LiteralPath $webConfig -PathType Leaf)) { throw "Missing IIS web.config: $webConfig" }

$appcmd = Join-Path $env:windir "System32\inetsrv\appcmd.exe"
& $appcmd add backup "Before-EGAS-Travel-$(Get-Date -Format yyyyMMdd-HHmmss)" | Out-Null

if ($PSCmdlet.ShouldProcess($SiteName, "Create or update IIS reverse-proxy site")) {
  Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "enabled" -Value $true
  Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "preserveHostHeader" -Value $true

  foreach ($variable in "HTTP_X_IIS_WINDOWS_USER", "HTTP_X_FORWARDED_PROTO") {
    $existing = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/rewrite/allowedServerVariables/add[@name='$variable']" -Name "." -ErrorAction SilentlyContinue
    if (-not $existing) {
      Add-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." -Value @{ name = $variable }
    }
  }

  if (-not (Test-Path "IIS:\AppPools\$SiteName")) { New-WebAppPool -Name $SiteName | Out-Null }
  Set-ItemProperty "IIS:\AppPools\$SiteName" -Name managedRuntimeVersion -Value ""
  Set-ItemProperty "IIS:\AppPools\$SiteName" -Name processModel.identityType -Value ApplicationPoolIdentity

  if (Test-Path "IIS:\Sites\$SiteName") {
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $resolvedProxyPath
  } else {
    New-Website -Name $SiteName -PhysicalPath $resolvedProxyPath -Port 80 -HostHeader $HostName -ApplicationPool $SiteName | Out-Null
  }

  Set-WebConfigurationProperty -PSPath "IIS:\" -Location $SiteName -Filter "system.webServer/security/authentication/anonymousAuthentication" -Name enabled -Value false
  Set-WebConfigurationProperty -PSPath "IIS:\" -Location $SiteName -Filter "system.webServer/security/authentication/windowsAuthentication" -Name enabled -Value true

  if ($CertificateThumbprint) {
    $certificate = Get-Item "Cert:\LocalMachine\My\$CertificateThumbprint" -ErrorAction Stop
    if (-not (Get-WebBinding -Name $SiteName -Protocol https -ErrorAction SilentlyContinue)) {
      New-WebBinding -Name $SiteName -Protocol https -Port 443 -HostHeader $HostName -SslFlags 1
    }
    $bindingPath = "IIS:\SslBindings\!443!$HostName"
    if (Test-Path $bindingPath) { Remove-Item $bindingPath -Force }
    New-Item $bindingPath -Thumbprint $certificate.Thumbprint -SSLFlags 1 | Out-Null
  }

  Start-Website -Name $SiteName
  Write-Output "IIS site '$SiteName' configured for $HostName. IT must still create DNS and verify the Kerberos SPN."
}
