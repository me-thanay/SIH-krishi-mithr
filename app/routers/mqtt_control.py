"""
MQTT Relay Control Router
Handles commands to control motor, HV generator, and HV auto mode via MQTT
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from paho.mqtt import client as mqtt_client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# MQTT broker details (same as mqtt_to_mongodb_krishimithr.py)
BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC_PUB = "krishimithr/device/cmd"  # publish control messages
CLIENT_ID = "fastapi-mqtt-control"

# Global MQTT client (singleton pattern)
_mqtt_client = None

def get_mqtt_client():
    """Get or create MQTT client singleton"""
    global _mqtt_client
    if _mqtt_client is None or not _mqtt_client.is_connected():
        try:
            client = mqtt_client.Client(CLIENT_ID)
            client.connect(BROKER, PORT, keepalive=60)
            client.loop_start()
            _mqtt_client = client
            print(f"✅ MQTT client connected for relay control")
        except Exception as e:
            print(f"❌ Failed to connect MQTT client: {e}")
            raise HTTPException(status_code=500, detail=f"MQTT connection failed: {str(e)}")
    return _mqtt_client

class RelayCommand(BaseModel):
    command: str  # "motor:on", "motor:off", "hv:on", "hv:off", "hv_auto:on", "hv_auto:off"

@router.post("/control")
async def control_relay(command: RelayCommand):
    """
    Send MQTT command to control relays
    
    Commands:
    - motor:on / motor:off - Control motor (Relay 1)
    - hv:on / hv:off - Control HV generator (Relay 2)
    - hv_auto:on / hv_auto:off - Control HV auto mode (motion-triggered)
    """
    try:
        # Validate command format
        valid_commands = [
            "motor:on", "motor:off",
            "hv:on", "hv:off",
            "hv_auto:on", "hv_auto:off"
        ]
        
        if command.command not in valid_commands:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid command. Valid commands: {', '.join(valid_commands)}"
            )
        
        # Get MQTT client
        client = get_mqtt_client()
        
        # Publish command
        result = client.publish(TOPIC_PUB, command.command)
        
        if result.rc == mqtt_client.MQTT_ERR_SUCCESS:
            return {
                "success": True,
                "message": f"Command '{command.command}' sent successfully",
                "command": command.command,
                "topic": TOPIC_PUB
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to publish MQTT command. Return code: {result.rc}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending MQTT command: {str(e)}"
        )

@router.get("/status")
async def get_mqtt_status():
    """Get MQTT connection status"""
    try:
        client = get_mqtt_client()
        is_connected = client.is_connected()
        return {
            "connected": is_connected,
            "broker": BROKER,
            "port": PORT,
            "topic": TOPIC_PUB,
            "client_id": CLIENT_ID
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "broker": BROKER,
            "port": PORT,
            "topic": TOPIC_PUB
        }


@router.get("/latest-sensor")
async def latest_sensor_reading():
    """Latest Goa ESP32 payload from in-memory MQTT ingest (and Mongo if available)."""
    from app.services.sensor_bus import get_latest

    live = get_latest()
    if live:
        out = dict(live)
        ts = out.get("timestamp")
        if hasattr(ts, "isoformat"):
            out["timestamp"] = ts.isoformat()
        return {"ok": True, "source": "mqtt_live", "data": out}
    try:
        from app.camera_scans import get_db

        db = get_db()
        if db is not None:
            doc = db["sensor_readings"].find_one(sort=[("timestamp", -1)])
            if doc:
                doc.pop("_id", None)
                ts = doc.get("timestamp")
                if hasattr(ts, "isoformat"):
                    doc["timestamp"] = ts.isoformat()
                return {"ok": True, "source": "mongo", "data": doc}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "source": None, "data": None, "error": str(exc)}
    return {"ok": False, "source": None, "data": None, "message": "No ESP32 reading yet"}

