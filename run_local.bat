@echo off
REM Windows batch script to run MQTT service locally

REM Change to the script's directory
cd /d "%~dp0"

echo ========================================
echo KRISHI MITHR - MQTT Service (Local)
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Ensure .env exists (prefer .env.local, otherwise create with provided creds)
if not exist .env (
    if exist .env.local (
        echo .env not found. Copying from .env.local ...
        copy /Y .env.local .env >nul
    ) else (
        echo .env not found. Creating .env with DATABASE_URL for MQTT -> MongoDB...
        echo DATABASE_URL=mongodb+srv://trythanay_db_user:20406080p@cluster0.gkbyivi.mongodb.net/krishi-mithr?retryWrites=true&w=majority&appName=Cluster0&authSource=admin > .env
    )
    echo.
)

REM If both .env and .env.local exist but DATABASE_URL is missing, append it
findstr /B /C:"DATABASE_URL=" .env >nul 2>&1
if errorlevel 1 (
    echo DATABASE_URL missing in .env, adding it now...
    echo DATABASE_URL=mongodb+srv://trythanay_db_user:20406080p@cluster0.gkbyivi.mongodb.net/krishi-mithr?retryWrites=true&w=majority&appName=Cluster0&authSource=admin >> .env
    echo.
)

REM Pick requirements file (prefer backend MQTT requirements)
set "REQ_FILE=requirements_mqtt.backend.txt"
if not exist "%REQ_FILE%" (
    if exist "requirements_mqtt.txt" (
        set "REQ_FILE=requirements_mqtt.txt"
    ) else if exist "requirements_mqtt.txt.bak" (
        set "REQ_FILE=requirements_mqtt.txt.bak"
    ) else (
        set "REQ_FILE=requirements.txt"
    )
)

REM Check if dependencies are installed
echo Checking dependencies (using %REQ_FILE%)...
python -c "import paho.mqtt.client" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r "%REQ_FILE%"
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting MQTT service...
echo Press Ctrl+C to stop
echo ========================================
echo.

REM Run the service
python mqtt_to_mongodb_krishimithr.py

pause

