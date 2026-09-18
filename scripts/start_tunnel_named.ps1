# Stable public URL for local GPU API (same hostname after every restart).
# Uses localtunnel fixed subdomain — no Cloudflare domain purchase required.
#
# Prerequisites: API running (scripts\run_local_gpu.ps1)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_named.ps1
#
# One-time Vercel env (then never change unless you change SUBDOMAIN below):
#   NEXT_PUBLIC_API_URL     = https://krishi-mithr-api.loca.lt
#   NEXT_PUBLIC_BACKEND_URL = https://krishi-mithr-api.loca.lt
#   → Redeploy once
#
# After laptop power-off: only run_local_gpu.ps1 + this script. No Vercel edit.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Port = if ($env:PORT) { $env:PORT } else { "8000" }
$Subdomain = if ($env:TUNNEL_SUBDOMAIN) { $env:TUNNEL_SUBDOMAIN } else { "krishi-mithr-api" }
$PublicUrl = "https://$Subdomain.loca.lt"
$Local = "http://127.0.0.1:$Port"

Write-Host "Checking local API $Local/health ..." -ForegroundColor Cyan
try {
  $h = Invoke-RestMethod -Uri "$Local/health" -TimeoutSec 5
  Write-Host ("Local OK: status={0} device={1} torch={2}" -f $h.status, $h.inference_device, $h.torch_available) -ForegroundColor Green
} catch {
  Write-Host "Start the API first: powershell -File scripts\run_local_gpu.ps1" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Starting NAMED tunnel (stable URL)" -ForegroundColor Cyan
Write-Host "  Public: $PublicUrl" -ForegroundColor Green
Write-Host "  Local:  $Local"
Write-Host ""
Write-Host "Vercel (one time): set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_BACKEND_URL to:" -ForegroundColor Yellow
Write-Host "  $PublicUrl" -ForegroundColor Yellow
Write-Host "Then Redeploy. Keep this window open while demoing." -ForegroundColor Yellow
Write-Host ""

# Persist for other scripts / reminders
$cfg = @{
  provider = "localtunnel"
  subdomain = $Subdomain
  public_url = $PublicUrl
  local_url = $Local
  updated_at = (Get-Date).ToString("o")
}
$cfgPath = Join-Path $Root "scripts\tunnel-named.json"
$cfg | ConvertTo-Json | Set-Content -Path $cfgPath -Encoding UTF8

npx --yes localtunnel --port $Port --subdomain $Subdomain
