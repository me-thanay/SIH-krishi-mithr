# One-shot helper: print demo checklist for PC GPU + tunnel + Vercel.
Write-Host @"

Krishi Mithr — local GPU Diagnose (YOLO + EfficientNet)
=======================================================

Terminal 1 (keep open):
  powershell -ExecutionPolicy Bypass -File scripts\run_local_gpu.ps1

Terminal 2 (keep open) — pick one:
  powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_cloudflare.ps1
  powershell -ExecutionPolicy Bypass -File scripts\start_tunnel_ngrok.ps1

Vercel → Settings → Environment Variables:
  NEXT_PUBLIC_API_URL     = https://YOUR-TUNNEL-URL   (no trailing slash)
  NEXT_PUBLIC_BACKEND_URL = same as above
  → Save → Deployments → Redeploy

Before jury:
  1. PC plugged in, sleep off
  2. Both terminals running
  3. Open https://YOUR-TUNNEL-URL/health in browser
  4. Phone: open Vercel site → Diagnose → real leaf close-up

ESP32-CAM: POST to https://YOUR-TUNNEL-URL/api/pest/device-scan
  (set DEVICE_UPLOAD_KEY on the PC process if you use a key)

"@ -ForegroundColor Cyan
