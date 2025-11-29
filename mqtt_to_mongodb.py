"""
Simple MQTT to MongoDB service
Receives sensor data from MQTT and saves to MongoDB organized by data type
"""
from paho.mqtt import client as mqtt_client
import json
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0")

# MQTT broker details
broker = "broker.hivemq.com"
port = 1883
topic_sub = "ravindra/sensor/data"   # ESP32 publishes JSON here
topic_pub = "ravindra/device/led"    # ESP32 listens here for LED commands
client_id = "mqtt-mongodb-service"

# Connect to MongoDB
def connect_mongodb():
    try:
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        print("[OK] Connected to MongoDB Atlas")
        return client
    except ConnectionFailure as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        return None

# Initialize MongoDB connection
mongo_client = connect_mongodb()
if mongo_client:
    db = mongo_client['krishi-mithr']
    print("[OK] Database 'krishi-mithr' ready")
else:
    print("[ERROR] MongoDB connection failed. Exiting...")
    exit(1)

# Save sensor data organized by type
def save_sensor_data(data):
    """Save sensor data to MongoDB, organized by data type"""
    try:
        timestamp = datetime.utcnow()
        
        # Filter and save each data type to its own collection
        collections_to_save = {}
        
        # Temperature data
        if "temperature" in data:
            collections_to_save["temperature_data"] = {
                "value": float(data["temperature"]),
                "unit": "celsius",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # Humidity data
        if "humidity" in data:
            collections_to_save["humidity_data"] = {
                "value": float(data["humidity"]),
                "unit": "percent",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # CO2 data
        if "CO2_ppm" in data:
            collections_to_save["co2_data"] = {
                "value": float(data["CO2_ppm"]),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # NH3 data
        if "NH3_ppm" in data:
            collections_to_save["nh3_data"] = {
                "value": float(data["NH3_ppm"]),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # Benzene data
        if "Benzene_ppm" in data:
            collections_to_save["benzene_data"] = {
                "value": float(data["Benzene_ppm"]),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # Smoke data
        if "Smoke_ppm" in data:
            collections_to_save["smoke_data"] = {
                "value": float(data["Smoke_ppm"]),
                "unit": "ppm",
                "timestamp": timestamp,
                "device_id": data.get("device_id", "esp32_sensor"),
                "location": data.get("location", "farm_field_1")
            }
        
        # Save to respective collections
        for collection_name, doc in collections_to_save.items():
            collection = db[collection_name]
            result = collection.insert_one(doc)
            print(f"[SAVED] {collection_name}: {doc['value']} {doc['unit']} (ID: {result.inserted_id})")
        
        # Also save complete record for reference
        complete_record = {
            "timestamp": timestamp,
            "device_id": data.get("device_id", "esp32_sensor"),
            "location": data.get("location", "farm_field_1"),
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "CO2_ppm": data.get("CO2_ppm"),
            "NH3_ppm": data.get("NH3_ppm"),
            "Benzene_ppm": data.get("Benzene_ppm"),
            "Smoke_ppm": data.get("Smoke_ppm"),
            "air_quality_status": calculate_air_quality(data)
        }
        
        db["sensor_readings_complete"].insert_one(complete_record)
        print(f"[SAVED] Complete record saved")
        
    except Exception as e:
        print(f"[ERROR] Error saving to MongoDB: {e}")

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

# MQTT connect
def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("[OK] Connected to MQTT broker")
            client.subscribe(topic_sub)
            print(f"[OK] Subscribed to topic: {topic_sub}")
        else:
            print(f"[ERROR] Failed to connect, return code {rc}")

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            print(f"[RECEIVED] Data from MQTT: {data}")
            
            # Save to MongoDB
            save_sensor_data(data)
            
        except Exception as e:
            print(f"[ERROR] Error parsing message: {e}")

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port)
    return client

# Main
if __name__ == "__main__":
    print("=" * 50)
    print("MQTT to MongoDB Service")
    print("=" * 50)
    print(f"MQTT Broker: {broker}:{port}")
    print(f"Topic: {topic_sub}")
    print(f"MongoDB: Connected")
    print("=" * 50)
    print("Waiting for MQTT messages...")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    
    try:
        client = connect_mqtt()
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n[STOPPED] Service stopped by user")
        if mongo_client:
            mongo_client.close()
            print("[CLOSED] MongoDB connection closed")

