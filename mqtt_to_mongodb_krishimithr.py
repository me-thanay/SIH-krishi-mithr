"""
MQTT to MongoDB Atlas Service for KRISHI MITHR
Receives sensor data from MQTT and saves to MongoDB Atlas
Removed tkinter GUI - pure data integration service
"""
from paho.mqtt import client as mqtt_client
import json
from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
import signal
import sys
import threading
import time

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
# Default now uses provided creds; prefer .env DATABASE_URL if set.
MONGODB_URI = os.getenv(
    "DATABASE_URL",
    "mongodb+srv://trythanay_db_user:20406080p@cluster0.gkbyivi.mongodb.net/krishi-mithr?retryWrites=true&w=majority&appName=Cluster0&authSource=admin"
)

# MQTT broker details
broker = "broker.hivemq.com"
port = 1883
topic_pub = "krishimithr/device/cmd"     # publish control messages
topic_sub = "krishimithr/sensor/data"    # subscribe to ESP32 sensor data
client_id = "python-mongodb-service"

# Global MongoDB client
mongo_client = None
db = None

# Connect to MongoDB
def connect_mongodb():
    """Connect to MongoDB Atlas"""
    try:
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
        return client
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None

# Calculate water quality status based on TDS
def calculate_water_quality(tds_value):
    """Calculate water quality status from TDS value"""
    try:
        tds_val = float(tds_value)
        if tds_val <= 10:
            return "Pure Water (Distilled)"
        elif 10 < tds_val <= 300:
            return "Tap Water"
        elif 300 < tds_val <= 500:
            return "Safe Drinking Water"
        elif tds_val > 1000:
            return "Fertilizer Solution / High TDS"
        else:
            return "Moderate Water Quality"
    except:
        return "Unknown"

# Calculate air quality status
def calculate_air_quality(data):
    """Calculate air quality status based on sensor values"""
    try:
        co2 = float(data.get("CO2_ppm", 0))
        nh3 = float(data.get("NH3_ppm", 0))
        benzene = float(data.get("Benzene_ppm", 0))
        smoke = float(data.get("Smoke_ppm", 0))
        
        if co2 > 1000 or nh3 > 25 or benzene > 5 or smoke > 50:
            return "poor"
        else:
            return "good"
    except:
        return "unknown"

# Get light status from LDR value
def get_light_status(light_value):
    """Get light status description from LDR value"""
    try:
        light_val = int(light_value)
        if light_val == 0:
            return "Sun Rise"
        elif light_val == 1:
            return "Sun Set"
        else:
            return f"Light Level: {light_val}"
    except:
        return "Unknown"

# Save sensor data to MongoDB
def save_sensor_data(data):
    """Save all sensor data to MongoDB"""
    if db is None:
        print("⚠️  MongoDB not connected, skipping save")
        return
    
    try:
        timestamp = datetime.now(timezone.utc)
        
        # Extract all sensor values from incoming MQTT JSON
        temperature = data.get("temperature")
        humidity = data.get("humidity")
        motion = data.get("motion")
        soil_moisture = data.get("soilMoisture")
        rain_status = data.get("raindata")
        motor_state = data.get("motor", "false")
        hv_state = data.get("hv", "false")
        hv_auto_state = data.get("hv_auto", "false")
        
        # MQ135 Air Quality sensors
        co2 = data.get("CO2_ppm")
        nh3 = data.get("NH3_ppm")
        benzene = data.get("Benzene_ppm")
        smoke = data.get("Smoke_ppm")
        
        # TDS and Water Quality
        tds_value = data.get("TDS")
        # Treat 0 and any numeric value as valid (only skip if missing/placeholder)
        water_quality = (
            calculate_water_quality(tds_value)
            if tds_value not in (None, "", "--")
            else None
        )
        
        # LDR Light sensor
        light_value = data.get("light")
        light_status = get_light_status(light_value) if light_value is not None else None
        
        # Calculate air quality status
        air_quality_status = calculate_air_quality(data)
        
        # Create complete sensor reading document
        sensor_doc = {
            "timestamp": timestamp,
            "device_id": data.get("device_id", "esp32_sensor"),
            "location": data.get("location", "farm_field_1"),
            
            # Environmental sensors
            "temperature": float(temperature) if temperature is not None else None,
            "humidity": float(humidity) if humidity is not None else None,
            "motion": str(motion) if motion is not None else None,
            "motion_detected": (str(motion) == '1') if motion is not None else None,
            "soil_moisture": float(soil_moisture) if soil_moisture is not None else None,
            "rain_status": str(rain_status) if rain_status is not None else None,
            
            # Air Quality sensors (MQ135)
            "CO2_ppm": float(co2) if co2 is not None else None,
            "NH3_ppm": float(nh3) if nh3 is not None else None,
            "Benzene_ppm": float(benzene) if benzene is not None else None,
            "Smoke_ppm": float(smoke) if smoke is not None else None,
            "air_quality_status": air_quality_status,
            
            # Water Quality sensors
            "TDS": float(tds_value) if tds_value is not None else None,
            "water_quality": water_quality,
            
            # Light sensor
            "light": int(light_value) if light_value is not None else None,
            "light_status": light_status,
            
            # Motor / HV relay status
            "motor_state": str(motor_state),
            "motor_on": (str(motor_state).lower() == 'true'),
            "hv_state": str(hv_state),
            "hv_on": (str(hv_state).lower() == 'true'),
            "hv_auto_state": str(hv_auto_state),
            "hv_auto_on": (str(hv_auto_state).lower() == 'true')
        }
        
        # Save to main sensor readings collection
        # Use upsert to update the latest reading (keep only current values)
        # This ensures website always shows the most recent data
        device_id = sensor_doc["device_id"]
        location = sensor_doc["location"]
        
        result = db["sensor_readings"].update_one(
            {"device_id": device_id, "location": location},
            {"$set": sensor_doc},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"✅ Created new sensor reading (ID: {result.upserted_id})")
        else:
            print(f"✅ Updated latest sensor reading")
        
        # Keep only last 50 readings for history (optional - for charts/graphs)
        # Delete older documents to keep database size manageable
        try:
            # Get count of documents
            count = db["sensor_readings"].count_documents({"device_id": device_id, "location": location})
            if count > 50:
                # Delete oldest documents, keep only last 50
                oldest = db["sensor_readings"].find(
                    {"device_id": device_id, "location": location}
                ).sort("timestamp", 1).limit(count - 50)
                ids_to_delete = [doc["_id"] for doc in oldest]
                if ids_to_delete:
                    db["sensor_readings"].delete_many({"_id": {"$in": ids_to_delete}})
                    print(f"🗑️  Cleaned up old data (kept last 50 readings)")
        except Exception as e:
            print(f"⚠️  Error cleaning old data: {e}")
        
        # Also save individual sensor data to separate collections for easier querying
        # Update latest value instead of inserting (keep only current value per sensor)
        collections_to_save = {}
        
        # Temperature data
        if temperature is not None:
            collections_to_save["temperature_data"] = {
                "value": float(temperature),
                "unit": "celsius",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # Humidity data
        if humidity is not None:
            collections_to_save["humidity_data"] = {
                "value": float(humidity),
                "unit": "percent",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # Soil moisture data
        if soil_moisture is not None:
            collections_to_save["soil_moisture_data"] = {
                "value": float(soil_moisture),
                "unit": "percent",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # CO2 data
        if co2 is not None:
            collections_to_save["co2_data"] = {
                "value": float(co2),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # NH3 data
        if nh3 is not None:
            collections_to_save["nh3_data"] = {
                "value": float(nh3),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # Benzene data
        if benzene is not None:
            collections_to_save["benzene_data"] = {
                "value": float(benzene),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # Smoke data
        if smoke is not None:
            collections_to_save["smoke_data"] = {
                "value": float(smoke),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # TDS data
        if tds_value is not None:
            collections_to_save["tds_data"] = {
                "value": float(tds_value),
                "unit": "ppm",
                "water_quality": water_quality,
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
        
        # Save to respective collections
        # Update latest value instead of inserting (keeps only current value)
        for collection_name, doc in collections_to_save.items():
            collection = db[collection_name]
            # Update the latest value for this device/location, or insert if doesn't exist
            collection.update_one(
                {"device_id": doc["device_id"], "location": doc["location"]},
                {"$set": doc},
                upsert=True
            )
            
            # Optional: Keep last 100 readings per sensor type for history
            try:
                count = collection.count_documents({"device_id": doc["device_id"], "location": doc["location"]})
                if count > 100:
                    oldest = collection.find(
                        {"device_id": doc["device_id"], "location": doc["location"]}
                    ).sort("timestamp", 1).limit(count - 100)
                    ids_to_delete = [d["_id"] for d in oldest]
                    if ids_to_delete:
                        collection.delete_many({"_id": {"$in": ids_to_delete}})
            except:
                pass  # Ignore cleanup errors for individual collections
        
        # Save motor / relay log if any relay state is present
        if motor_state is not None or hv_state is not None or hv_auto_state is not None:
            motor_log = {
                "motor_state": str(motor_state),
                "motor_on": (str(motor_state).lower() == 'true') if motor_state is not None else None,
                "hv_state": str(hv_state) if hv_state is not None else None,
                "hv_on": (str(hv_state).lower() == 'true') if hv_state is not None else None,
                "hv_auto_state": str(hv_auto_state) if hv_auto_state is not None else None,
                "hv_auto_on": (str(hv_auto_state).lower() == 'true') if hv_auto_state is not None else None,
                "timestamp": timestamp,
                "device_id": sensor_doc["device_id"],
                "location": sensor_doc["location"]
            }
            db["motor_logs"].insert_one(motor_log)
        
        # Console-friendly summary (replaces old Tkinter dashboard)
        print(f"📊 Data Summary:")
        print(f"   Temperature: {temperature}°C | Humidity: {humidity}%")
        print(f"   Soil Moisture: {soil_moisture}% | Rain: {rain_status}")
        print(f"   Air Quality: {air_quality_status.upper()} | Water Quality: {water_quality}")
        print(
            "   Relays: "
            f"Motor={'ON' if str(motor_state).lower() == 'true' else 'OFF'}, "
            f"HV={'ON' if str(hv_state).lower() == 'true' else 'OFF'}, "
            f"HV_AUTO={'ON' if str(hv_auto_state).lower() == 'true' else 'OFF'}"
        )
        
    except Exception as e:
        print(f"❌ Error saving to MongoDB: {e}")
        import traceback
        traceback.print_exc()

# MQTT connect
def connect_mqtt():
    """Connect to MQTT broker and set up message handlers"""
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT broker")
            client.subscribe(topic_sub)
            print(f"📡 Subscribed to topic: {topic_sub}")
        else:
            print(f"❌ Failed to connect to MQTT broker, return code: {rc}")

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            print(f"\n📥 Received MQTT message from {msg.topic}:")
            print(f"   Raw data: {data}")
            
            # Save to MongoDB
            save_sensor_data(data)
            
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON message: {e}")
            print(f"   Raw payload: {msg.payload.decode()}")
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            import traceback
            traceback.print_exc()

    def on_disconnect(client, userdata, rc):
        if rc != 0:
            print("⚠️  Unexpected MQTT disconnection. Attempting to reconnect...")
    
    def on_log(client, userdata, level, buf):
        # Keep connection alive with periodic logging
        pass

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    
    # Set keepalive to maintain connection (60 seconds)
    client._keepalive = 60
    
    try:
        client.connect(broker, port, keepalive=60)
        return client
    except Exception as e:
        print(f"❌ Error connecting to MQTT broker: {e}")
        return None

# Keep-alive function to prevent Render free tier spin-down
def keep_alive():
    """Periodic heartbeat to keep service active on free tier"""
    while True:
        time.sleep(300)  # Every 5 minutes
        if db:
            try:
                # Simple ping to MongoDB to show activity
                mongo_client.admin.command('ping')
                print("💓 Keep-alive: Service active")
            except:
                pass

# Graceful shutdown handler
def signal_handler(sig, frame):
    """Handle graceful shutdown"""
    print("\n\n🛑 Shutting down service...")
    if mongo_client:
        mongo_client.close()
        print("✅ MongoDB connection closed")
    sys.exit(0)

# Main
if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("=" * 60)
    print("KRISHI MITHR - MQTT to MongoDB Atlas Service")
    print("=" * 60)
    print(f"MQTT Broker: {broker}:{port}")
    print(f"Subscribe Topic: {topic_sub}")
    print(f"Publish Topic: {topic_pub}")
    print(f"MongoDB Database: krishi-mithr")
    print("=" * 60)
    
    # Initialize MongoDB connection
    mongo_client = connect_mongodb()
    if mongo_client:
        db = mongo_client['krishi-mithr']
        print("✅ Database 'krishi-mithr' ready")
    else:
        print("❌ MongoDB connection failed. Exiting...")
        sys.exit(1)
    
    print("\n🔄 Starting MQTT client...")
    print("⏳ Waiting for sensor data...")
    print("💓 Keep-alive enabled (prevents free tier spin-down)")
    print("Press Ctrl+C to stop\n")
    print("=" * 60)
    
    # Start keep-alive thread for free tier
    keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
    keep_alive_thread.start()
    print("✅ Keep-alive thread started")
    
    try:
        client = connect_mqtt()
        if client:
            # Start MQTT loop in background
            client.loop_start()
            
            # Keep main thread alive and monitor connection
            try:
                while True:
                    time.sleep(10)  # Check every 10 seconds
                    # Check if client is still connected
                    if not client.is_connected():
                        print("⚠️  MQTT disconnected, attempting reconnect...")
                        try:
                            client.reconnect()
                        except:
                            pass
            except KeyboardInterrupt:
                client.loop_stop()
        else:
            print("❌ Failed to connect to MQTT broker. Exiting...")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Service stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if mongo_client:
            mongo_client.close()
            print("✅ MongoDB connection closed")

