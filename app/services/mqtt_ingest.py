"""Background MQTT subscriber: HiveMQ -> sensor_bus (+ optional MongoDB).

Topics match Goa ESP32 firmware:
  publish  krishimithr/sensor/data
  command  krishimithr/device/cmd
"""

from __future__ import annotations

import json
import os
import threading
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPIC_SUB = os.getenv("MQTT_TOPIC_SENSOR", "krishimithr/sensor/data")
CLIENT_ID = os.getenv("MQTT_INGEST_CLIENT_ID", "krishi-mithr-fastapi-ingest")
MQTT_USER = os.getenv("MQTT_USER", "krishi1")
MQTT_PASS = os.getenv("MQTT_PASS", "krishi1")

_started = False
_thread: Optional[threading.Thread] = None


def _save_mongo(doc: Dict[str, Any]) -> None:
    uri = os.getenv("DATABASE_URL") or os.getenv("MONGODB_URI")
    if not uri:
        return
    try:
        from pymongo import MongoClient

        client = MongoClient(uri, serverSelectionTimeoutMS=4000)
        db_name = os.getenv("MONGODB_DB", "krishi-mithr")
        db = client[db_name]
        device_id = doc.get("device_id", "esp32_goa")
        location = doc.get("location", "farm_field_1")
        # Flatten for SIH schema used by mqtt_to_mongodb_krishimithr.py
        sensor_doc = {
            "timestamp": doc.get("timestamp"),
            "device_id": device_id,
            "location": location,
            "temperature": doc.get("temperature"),
            "humidity": doc.get("humidity"),
            "motion": str(doc.get("motion")) if doc.get("motion") is not None else None,
            "motion_detected": doc.get("motion_detected"),
            "soil_moisture": doc.get("soil_moisture", doc.get("soilMoisture")),
            "rain_status": str(doc.get("raindata")) if doc.get("raindata") is not None else None,
            "CO2_ppm": doc.get("CO2_ppm"),
            "NH3_ppm": doc.get("NH3_ppm"),
            "Benzene_ppm": doc.get("Benzene_ppm"),
            "Smoke_ppm": doc.get("Smoke_ppm"),
            "air_quality_status": doc.get("AirQuality"),
            "TDS": doc.get("TDS", doc.get("tds_ppm")),
            "water_quality": doc.get("waterStatus"),
            "light": doc.get("light"),
            "motor_state": str(doc.get("motor")),
            "motor_on": doc.get("motor_on"),
            "hv_state": str(doc.get("hv")),
            "hv_on": doc.get("hv_on"),
            "hv_auto_state": str(doc.get("hv_auto")),
            "hv_auto_on": doc.get("hv_auto_on"),
            "source": "goa_esp32_mqtt",
        }
        db["sensor_readings"].update_one(
            {"device_id": device_id, "location": location},
            {"$set": sensor_doc},
            upsert=True,
        )
        try:
            from app.services.hourly_rollup import roll_hourly

            roll_hourly(db, {**sensor_doc, **doc})
        except Exception as roll_exc:  # noqa: BLE001
            print(f"Hourly rollup skipped: {roll_exc}")
        client.close()
    except Exception as exc:  # noqa: BLE001
        print(f"MQTT ingest Mongo save skipped: {exc}")


def _on_message(_client, _userdata, msg) -> None:
    try:
        raw = msg.payload.decode("utf-8", errors="replace")
        data = json.loads(raw)
        from app.services.sensor_bus import set_latest

        doc = set_latest(data)
        _save_mongo(doc)
        print(
            f"MQTT sensor: soil={doc.get('soilMoisture') or doc.get('soil_moisture')} "
            f"tds={doc.get('TDS') or doc.get('tds_ppm')} temp={doc.get('temperature')}"
        )
    except Exception as exc:  # noqa: BLE001
        print(f"MQTT ingest parse error: {exc}")


def start_mqtt_ingest() -> None:
    """Idempotent background start (call from FastAPI startup)."""
    global _started, _thread
    if _started:
        return
    if os.getenv("MQTT_INGEST", "1").strip().lower() in {"0", "false", "no"}:
        print("MQTT ingest disabled (MQTT_INGEST=0)")
        return

    def run() -> None:
        try:
            from paho.mqtt import client as mqtt_client

            try:
                client = mqtt_client.Client(
                    callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2,
                    client_id=CLIENT_ID,
                )
            except Exception:
                client = mqtt_client.Client(CLIENT_ID)

            if MQTT_USER:
                client.username_pw_set(MQTT_USER, MQTT_PASS)

            def on_connect(client, userdata, flags, reason_code, properties=None):
                code = reason_code
                if hasattr(reason_code, "value"):
                    code = reason_code.value
                if code == 0:
                    client.subscribe(TOPIC_SUB)
                    print(f"MQTT ingest subscribed to {TOPIC_SUB} @ {BROKER}")
                else:
                    print(f"MQTT ingest connect failed: {reason_code}")

            client.on_connect = on_connect
            client.on_message = _on_message
            client.connect(BROKER, PORT, keepalive=60)
            client.loop_forever()
        except Exception as exc:  # noqa: BLE001
            print(f"MQTT ingest stopped: {exc}")

    _thread = threading.Thread(target=run, name="mqtt-ingest", daemon=True)
    _thread.start()
    _started = True
    print("MQTT ingest thread started (Goa ESP32 -> sensor_bus)")
