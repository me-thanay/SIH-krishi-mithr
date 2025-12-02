@echo off
REM Windows batch script to run MQTT service locally
echo ========================================
echo KRISHI MITHR - MQTT Service (Local)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found
    echo Creating .env file with default DATABASE_URL...
    (
        echo DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
    ) > .env
    echo .env file created. Please verify DATABASE_URL is correct.
    echo.
)

REM Check if dependencies are installed
echo Checking dependencies...
python -c "import paho.mqtt.client" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements_mqtt.txt
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

