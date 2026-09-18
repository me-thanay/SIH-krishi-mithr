# Expose local FastAPI (port 8000) via Cloudflare quick tunnel (free HTTPS).
# Prerequisites: install cloudflared
#   winget install --id Cloudflare.cloudflared
#   or https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
#
# Usage (API must already be running via scripts\run_local_gpu.ps1):
#   powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_cloudflare.ps1
#
# Copy the https://....trycloudflare.com URL into Vercel:
#   NEXT_PUBLIC_API_URL / NEXT_PUBLIC_BACKEND_URL
# then Redeploy Vercel.

$ErrorActionPreference = "Stop"
$Port = if ($env:PORT) { $env:PORT } else { "8000" }
$Local = "http://127.0.0.1:$Port"

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host "cloudflared not found." -ForegroundColor Red
  Write-Host "Install: winget install --id Cloudflare.cloudflared"
  Write-Host "Then re-run this script."
  exit 1
}

Write-Host "Checking local API $Local/health ..." -ForegroundColor Cyan
try {
  $h = Invoke-RestMethod -Uri "$Local/health" -TimeoutSec 5
  Write-Host ("Local health: status={0} torch={1}" -f $h.status, $h.torch_available) -ForegroundColor Green
} catch {
  Write-Host "Local API not reachable. Start it first:" -ForegroundColor Yellow
  Write-Host "  powershell -File scripts\run_local_gpu.ps1"
  exit 1
}

Write-Host ""
Write-Host "Starting Cloudflare quick tunnel -> $Local" -ForegroundColor Cyan
Write-Host "Copy the https://*.trycloudflare.com URL into Vercel env, then redeploy." -ForegroundColor Yellow
Write-Host "Keep this window open while demoing." -ForegroundColor Yellow
Write-Host ""

& cloudflared tunnel --url $Local
