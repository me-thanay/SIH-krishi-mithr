# PowerShell script to run MQTT service as background process on Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KRISHI MITHR - MQTT Service (Background)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8 or higher" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env file with default DATABASE_URL..." -ForegroundColor Yellow
    @"
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env file created. Please verify DATABASE_URL is correct." -ForegroundColor Yellow
    Write-Host ""
}

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
try {
    python -c "import paho.mqtt.client" 2>&1 | Out-Null
    Write-Host "Dependencies OK" -ForegroundColor Green
} catch {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements_mqtt.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting MQTT service in background..." -ForegroundColor Cyan
Write-Host "Service will run in background. Check logs for output." -ForegroundColor Yellow
Write-Host "To stop: Get-Process python | Stop-Process" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the service in background
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python mqtt_to_mongodb_krishimithr.py
}

Write-Host "Service started! Job ID: $($job.Id)" -ForegroundColor Green
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  Receive-Job -Id $($job.Id) -Keep" -ForegroundColor White
Write-Host ""
Write-Host "To stop service:" -ForegroundColor Cyan
Write-Host "  Stop-Job -Id $($job.Id)" -ForegroundColor White
Write-Host "  Remove-Job -Id $($job.Id)" -ForegroundColor White

