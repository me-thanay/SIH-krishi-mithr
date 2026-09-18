# Expose local FastAPI (port 8000) via ngrok (free HTTPS).
# Prerequisites:
#   1) Install ngrok: winget install --id Ngrok.Ngrok  OR https://ngrok.com/download
#   2) ngrok config add-authtoken YOUR_TOKEN   (from https://dashboard.ngrok.com)
#
# Usage (API must already be running via scripts\run_local_gpu.ps1):
#   powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_ngrok.ps1
#
# Copy the https://....ngrok-free.app URL into Vercel:
#   NEXT_PUBLIC_API_URL / NEXT_PUBLIC_BACKEND_URL
# then Redeploy Vercel.

$ErrorActionPreference = "Stop"
$Port = if ($env:PORT) { $env:PORT } else { "8000" }
$Local = "http://127.0.0.1:$Port"

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
  Write-Host "ngrok not found." -ForegroundColor Red
  Write-Host "Install: winget install --id Ngrok.Ngrok"
  Write-Host "Then: ngrok config add-authtoken YOUR_TOKEN"
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
Write-Host "Starting ngrok http $Port" -ForegroundColor Cyan
Write-Host "Copy the https://*.ngrok-free.app Forwarding URL into Vercel env, then redeploy." -ForegroundColor Yellow
Write-Host "Keep this window open while demoing." -ForegroundColor Yellow
Write-Host ""

& ngrok http $Port
