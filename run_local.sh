#!/bin/bash
# Linux/Mac script to run MQTT service locally

echo "========================================"
echo "KRISHI MITHR - MQTT Service (Local)"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found"
    echo "Creating .env file with default DATABASE_URL..."
    cat > .env << EOF
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
EOF
    echo ".env file created. Please verify DATABASE_URL is correct."
    echo ""
fi

# Check if dependencies are installed
echo "Checking dependencies..."
python3 -c "import paho.mqtt.client" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements_mqtt.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "Starting MQTT service..."
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

# Run the service
python3 mqtt_to_mongodb_krishimithr.py

