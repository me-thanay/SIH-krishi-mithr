import tkinter as tk
from paho.mqtt import client as mqtt_client
import json
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0")

# MQTT broker details (HiveMQ public broker)
broker = "broker.hivemq.com"
port = 1883
topic_sub = "ravindra/sensor/data"   # ESP32 publishes JSON here
topic_pub = "ravindra/device/led"    # ESP32 listens here for LED commands
client_id = "dashboard-client"

# Connect to MongoDB
def connect_mongodb():
    try:
        client = MongoClient(MONGODB_URI)
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
        return client
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None

# Initialize MongoDB connection
mongo_client = connect_mongodb()
if mongo_client:
    db = mongo_client['krishi-mithr']
    sensor_collection = db['sensor_data']  # Collection for sensor readings
    motor_log_collection = db['motor_logs']  # Collection for motor control logs
else:
    sensor_collection = None
    motor_log_collection = None

# Tkinter window
window = tk.Tk()
window.title("KRISHI MITHR Dashboard")
window.geometry("450x550")
window.configure(bg="white")

# Labels for sensor data
temp_label = tk.Label(window, text="Temperature: -- °C", font=("Helvetica", 16), bg="white")
temp_label.pack(pady=10)

hum_label = tk.Label(window, text="Humidity: -- %", font=("Helvetica", 16), bg="white")
hum_label.pack(pady=10)

co2_label = tk.Label(window, text="CO₂: -- ppm", font=("Helvetica", 16), bg="white")
co2_label.pack(pady=10)

nh3_label = tk.Label(window, text="NH₃: -- ppm", font=("Helvetica", 16), bg="white")
nh3_label.pack(pady=10)

benzene_label = tk.Label(window, text="Benzene: -- ppm", font=("Helvetica", 16), bg="white")
benzene_label.pack(pady=10)

smoke_label = tk.Label(window, text="Smoke: -- ppm", font=("Helvetica", 16), bg="white")
smoke_label.pack(pady=10)

aq_status_label = tk.Label(window, text="Air Quality: --", font=("Helvetica", 16), bg="white", fg="blue")
aq_status_label.pack(pady=10)

status_label = tk.Label(window, text="Motor Status: OFF", font=("Helvetica", 14), bg="white", fg="grey")
status_label.pack(pady=10)

db_status_label = tk.Label(window, text="DB Status: Connected", font=("Helvetica", 12), bg="white", fg="green")
db_status_label.pack(pady=5)

# Save sensor data to MongoDB
def save_sensor_data(data):
    if sensor_collection is None:
        print("⚠️ MongoDB not connected, skipping save")
        return
    
    try:
        sensor_doc = {
            "temperature": float(data.get("temperature", 0)),
            "humidity": float(data.get("humidity", 0)),
            "CO2_ppm": float(data.get("CO2_ppm", 0)),
            "NH3_ppm": float(data.get("NH3_ppm", 0)),
            "Benzene_ppm": float(data.get("Benzene_ppm", 0)),
            "Smoke_ppm": float(data.get("Smoke_ppm", 0)),
            "timestamp": datetime.utcnow(),
            "device_id": "esp32_sensor",
            "location": "farm_field_1"  # You can make this configurable
        }
        
        # Calculate air quality status
        if (sensor_doc["CO2_ppm"] > 1000 or 
            sensor_doc["NH3_ppm"] > 25 or 
            sensor_doc["Benzene_ppm"] > 5 or 
            sensor_doc["Smoke_ppm"] > 50):
            sensor_doc["air_quality_status"] = "poor"
        else:
            sensor_doc["air_quality_status"] = "good"
        
        # Insert into MongoDB
        result = sensor_collection.insert_one(sensor_doc)
        print(f"💾 Saved sensor data to MongoDB: {result.inserted_id}")
        
    except Exception as e:
        print(f"❌ Error saving to MongoDB: {e}")

# Save motor control log to MongoDB
def save_motor_log(action, status):
    if motor_log_collection is None:
        return
    
    try:
        log_doc = {
            "action": action,  # "on" or "off"
            "status": status,  # "ON" or "OFF"
            "timestamp": datetime.utcnow(),
            "device_id": "esp32_motor",
            "location": "farm_field_1"
        }
        
        result = motor_log_collection.insert_one(log_doc)
        print(f"💾 Saved motor log to MongoDB: {result.inserted_id}")
        
    except Exception as e:
        print(f"❌ Error saving motor log: {e}")

# MQTT connect
def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT broker")
            client.subscribe(topic_sub)
        else:
            print(f"❌ Failed to connect, return code {rc}")

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            temp = data.get("temperature", "--")
            hum = data.get("humidity", "--")
            co2 = data.get("CO2_ppm", "--")
            nh3 = data.get("NH3_ppm", "--")
            benzene = data.get("Benzene_ppm", "--")
            smoke = data.get("Smoke_ppm", "--")

            # Update labels
            temp_label.config(text=f"Temperature: {temp} °C")
            hum_label.config(text=f"Humidity: {hum} %")
            co2_label.config(text=f"CO₂: {co2} ppm")
            nh3_label.config(text=f"NH₃: {nh3} ppm")
            benzene_label.config(text=f"Benzene: {benzene} ppm")
            smoke_label.config(text=f"Smoke: {smoke} ppm")

            # Air quality condition check
            try:
                if float(co2) > 1000 or float(nh3) > 25 or float(benzene) > 5 or float(smoke) > 50:
                    aq_status_label.config(text="⚠ Poor Air Quality", fg="red")
                else:
                    aq_status_label.config(text="✅ Good Air Quality", fg="green")
            except:
                aq_status_label.config(text="Air Quality: --", fg="blue")

            # Save to MongoDB
            save_sensor_data(data)

            print(f"📥 Received: {data}")
        except Exception as e:
            print(f"❌ Error parsing message: {e}")

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port)
    return client

# Publish LED control
is_on = False
def toggle_led():
    global is_on
    if is_on:
        msg = "off"
        client.publish(topic_pub, msg)
        status_label.config(text="Motor Status: OFF", fg="grey")
        save_motor_log("off", "OFF")
        print("📤 Published motor OFF")
        is_on = False
    else:
        msg = "on"
        client.publish(topic_pub, msg)
        status_label.config(text="Motor Status: ON", fg="red")
        save_motor_log("on", "ON")
        print("📤 Published motor ON")
        is_on = True

# Update DB status
def update_db_status():
    if mongo_client:
        try:
            mongo_client.admin.command('ping')
            db_status_label.config(text="DB Status: Connected", fg="green")
        except:
            db_status_label.config(text="DB Status: Disconnected", fg="red")
    else:
        db_status_label.config(text="DB Status: Not Connected", fg="red")

# Button to toggle LED
toggle_button = tk.Button(window, text="Motor Control", command=toggle_led, font=("Helvetica", 14))
toggle_button.pack(pady=20)

# Start MQTT client
client = connect_mqtt()
client.loop_start()

# Update DB status periodically
update_db_status()
window.after(5000, update_db_status)  # Check every 5 seconds

# Run Tkinter GUI
window.mainloop()
client.loop_stop()

# Close MongoDB connection
if mongo_client:
    mongo_client.close()
    print("🔌 MongoDB connection closed")

