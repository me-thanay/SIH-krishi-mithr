# Print the stable named-tunnel URL (from scripts/tunnel-named.json if present).
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$cfgPath = Join-Path $Root "scripts\tunnel-named.json"
$Url = "https://krishi-mithr-api.loca.lt"
if (Test-Path $cfgPath) {
  try { $Url = (Get-Content $cfgPath -Raw | ConvertFrom-Json).public_url } catch {}
}

Write-Host @"

Stable Diagnose URL (named tunnel)
==================================
$Url

Vercel → Environment Variables (once):
  NEXT_PUBLIC_API_URL     = $Url
  NEXT_PUBLIC_BACKEND_URL = $Url
  (no trailing slash, must be https)
Then: Deployments → Redeploy

After power-off, only:
  1) powershell -File scripts\run_local_gpu.ps1
  2) powershell -File scripts\start_tunnel_named.ps1
Do NOT change Vercel again (same URL).

YOLO + EfficientNet still run on your RTX 3050.

"@ -ForegroundColor Cyan
