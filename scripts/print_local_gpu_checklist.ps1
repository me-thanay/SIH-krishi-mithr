# Print demo checklist for PC GPU + named (stable) tunnel + Vercel.
Write-Host @"

Krishi Mithr — local GPU Diagnose (YOLO + EfficientNet)
=======================================================

Terminal 1 (keep open):
  powershell -ExecutionPolicy Bypass -File scripts\run_local_gpu.ps1

Terminal 2 (keep open) — NAMED tunnel (stable URL):
  powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_named.ps1

  Stable URL: https://krishi-mithr-api.loca.lt
  Set Vercel once; after power-off you do NOT change Vercel again.

Vercel → Settings → Environment Variables:
  NEXT_PUBLIC_API_URL     = https://krishi-mithr-api.loca.lt
  NEXT_PUBLIC_BACKEND_URL = https://krishi-mithr-api.loca.lt
  → Save → Deployments → Redeploy

Before jury:
  1. PC plugged in, sleep off
  2. Both terminals running
  3. Open https://krishi-mithr-api.loca.lt/health
  4. Phone: Vercel site → Diagnose → real leaf close-up

"@ -ForegroundColor Cyan
