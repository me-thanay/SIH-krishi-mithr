"""
Script to verify MQTT data is being saved to MongoDB Atlas
Run this to check if your MQTT service is working correctly
"""
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGODB_URI = os.getenv("DATABASE_URL", "mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0")

def check_mongodb_data():
    """Check if MQTT data is being saved to MongoDB"""
    try:
        print("=" * 60)
        print("MongoDB Data Verification")
        print("=" * 60)
        
        # Connect to MongoDB
        print("\n🔌 Connecting to MongoDB Atlas...")
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
        
        db = client['krishi-mithr']
        print(f"✅ Database 'krishi-mithr' accessed")
        
        # Check main collection
        print("\n" + "=" * 60)
        print("Checking Collections...")
        print("=" * 60)
        
        collections = db.list_collection_names()
        print(f"\n📊 Found {len(collections)} collections:")
        for col in sorted(collections):
            count = db[col].count_documents({})
            print(f"   - {col}: {count} documents")
        
        # Check main sensor_readings collection
        print("\n" + "=" * 60)
        print("Main Collection: sensor_readings")
        print("=" * 60)
        
        sensor_collection = db['sensor_readings']
        total_count = sensor_collection.count_documents({})
        print(f"\n📈 Total documents: {total_count}")
        
        if total_count > 0:
            # Get latest document
            latest = sensor_collection.find().sort("timestamp", -1).limit(1).next()
            print(f"\n📅 Latest data timestamp: {latest.get('timestamp')}")
            print(f"📱 Device ID: {latest.get('device_id', 'N/A')}")
            print(f"📍 Location: {latest.get('location', 'N/A')}")
            
            # Show sensor values
            print("\n📊 Sensor Values:")
            sensors = {
                'Temperature': latest.get('temperature'),
                'Humidity': latest.get('humidity'),
                'Soil Moisture': latest.get('soil_moisture'),
                'CO₂': latest.get('CO2_ppm'),
                'NH₃': latest.get('NH3_ppm'),
                'Benzene': latest.get('Benzene_ppm'),
                'Smoke': latest.get('Smoke_ppm'),
                'TDS': latest.get('TDS'),
                'Light': latest.get('light'),
                'Motion': latest.get('motion'),
                'Rain': latest.get('rain_status'),
                'Motor': latest.get('motor_state')
            }
            
            for sensor, value in sensors.items():
                if value is not None:
                    unit = ""
                    if sensor in ['Temperature']:
                        unit = " °C"
                    elif sensor in ['Humidity', 'Soil Moisture']:
                        unit = " %"
                    elif sensor in ['CO₂', 'NH₃', 'Benzene', 'Smoke', 'TDS']:
                        unit = " ppm"
                    print(f"   ✅ {sensor}: {value}{unit}")
                else:
                    print(f"   ⚠️  {sensor}: Not available")
            
            # Check data from last 24 hours
            print("\n" + "=" * 60)
            print("Recent Data (Last 24 Hours)")
            print("=" * 60)
            
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            recent_count = sensor_collection.count_documents({
                "timestamp": {"$gte": cutoff_time}
            })
            print(f"\n📊 Documents in last 24 hours: {recent_count}")
            
            if recent_count > 0:
                print("✅ Data is being saved successfully!")
            else:
                print("⚠️  No data in last 24 hours. Check if MQTT service is running.")
        else:
            print("\n⚠️  No data found in sensor_readings collection")
            print("   Make sure:")
            print("   1. MQTT service is running")
            print("   2. ESP32 is publishing data to MQTT")
            print("   3. MQTT topic is correct: krishimithr/sensor/data")
        
        # Check individual sensor collections
        print("\n" + "=" * 60)
        print("Individual Sensor Collections")
        print("=" * 60)
        
        sensor_collections = {
            'temperature_data': 'Temperature',
            'humidity_data': 'Humidity',
            'soil_moisture_data': 'Soil Moisture',
            'co2_data': 'CO₂',
            'nh3_data': 'NH₃',
            'benzene_data': 'Benzene',
            'smoke_data': 'Smoke',
            'tds_data': 'TDS'
        }
        
        for collection_name, sensor_name in sensor_collections.items():
            if collection_name in collections:
                count = db[collection_name].count_documents({})
                if count > 0:
                    latest = db[collection_name].find().sort("timestamp", -1).limit(1).next()
                    print(f"   ✅ {sensor_name}: {count} records (latest: {latest.get('value')} {latest.get('unit', '')})")
                else:
                    print(f"   ⚠️  {sensor_name}: 0 records")
            else:
                print(f"   ❌ {sensor_name}: Collection not found")
        
        # Check motor logs
        print("\n" + "=" * 60)
        print("Motor Logs")
        print("=" * 60)
        
        if 'motor_logs' in collections:
            motor_count = db['motor_logs'].count_documents({})
            print(f"📊 Motor log entries: {motor_count}")
            if motor_count > 0:
                latest_motor = db['motor_logs'].find().sort("timestamp", -1).limit(1).next()
                print(f"   Latest: {latest_motor.get('motor_state')} at {latest_motor.get('timestamp')}")
        else:
            print("   ⚠️  motor_logs collection not found")
        
        print("\n" + "=" * 60)
        print("Verification Complete")
        print("=" * 60)
        
        client.close()
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("\n💡 Check:")
        print("   1. DATABASE_URL is correct")
        print("   2. MongoDB Atlas Network Access allows your IP")
        print("   3. Internet connection is active")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_mongodb_data()

