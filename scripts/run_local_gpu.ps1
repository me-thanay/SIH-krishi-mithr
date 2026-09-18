# Run Krishi Mithr FastAPI on this PC with CUDA + full YOLO→EfficientNet.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\run_local_gpu.ps1
#
# Then in another terminal start a tunnel (Cloudflare or ngrok) and point
# Vercel NEXT_PUBLIC_API_URL at the https://... URL.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Repo: $Root" -ForegroundColor Cyan

# Prefer repo venv if present
$venvPython = Join-Path $Root ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
  $Python = $venvPython
  Write-Host "Using .venv Python" -ForegroundColor Green
} else {
  $Python = "python"
  Write-Host "Using system Python (create .venv if imports fail)" -ForegroundColor Yellow
}

& $Python -c "import torch; print('torch', torch.__version__, 'cuda', torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only')"
if ($LASTEXITCODE -ne 0) { throw "Python/torch check failed" }

$env:PYTHONPATH = $Root
$env:INFERENCE_DEVICE = "cuda"
$env:DIAGNOSE_SKIP_YOLO = "0"
$env:DIAGNOSE_LIGHT = "0"
$env:ENABLE_IP102_YOLO = "0"
$env:DIAGNOSE_MAX_SIDE = "1280"
$env:YOLO_SUBPROCESS_TIMEOUT = "120"
$env:OMP_NUM_THREADS = "4"
$env:TORCH_NUM_THREADS = "4"
# Optional: set DEVICE_UPLOAD_KEY for ESP32-CAM if you use it
# $env:DEVICE_UPLOAD_KEY = "change-me"

$Port = if ($env:PORT) { $env:PORT } else { "8000" }

Write-Host ""
Write-Host "Starting uvicorn on http://0.0.0.0:$Port (GPU diagnose)" -ForegroundColor Cyan
Write-Host "  INFERENCE_DEVICE=$env:INFERENCE_DEVICE"
Write-Host "  DIAGNOSE_SKIP_YOLO=$env:DIAGNOSE_SKIP_YOLO"
Write-Host "Health: http://127.0.0.1:$Port/health"
Write-Host "Next:  powershell -File scripts\start_tunnel_cloudflare.ps1"
Write-Host "   or: powershell -File scripts\start_tunnel_ngrok.ps1"
Write-Host ""

& $Python -m uvicorn app.main:app --host 0.0.0.0 --port $Port
