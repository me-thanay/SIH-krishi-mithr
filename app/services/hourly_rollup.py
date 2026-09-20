"""Roll live MQTT readings into 24 hourly summaries per field (linked by farmer_id)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional


def _finite(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        n = float(value)
        if n != n:  # NaN
            return None
        return n
    except (TypeError, ValueError):
        return None


def _reading_id(doc: Dict[str, Any]) -> str:
    ts = doc.get("timestamp")
    iso = ts.isoformat() if hasattr(ts, "isoformat") else str(ts or "")
    soil = doc.get("soil_moisture", doc.get("soilMoisture"))
    return f"{doc.get('device_id')}|{iso}|{soil}|{doc.get('temperature')}"


def roll_hourly(db, doc: Dict[str, Any]) -> None:
    device_id = str(doc.get("device_id") or "esp32_goa")
    profiles = list(
        db["farm_profiles"]
        .find({"setupComplete": True})
        .sort("updatedAt", -1)
        .limit(8)
    )
    targets = [p for p in profiles if not p.get("deviceId") or p.get("deviceId") == device_id]
    if not targets:
        return

    ts = doc.get("timestamp")
    if not isinstance(ts, datetime):
        ts = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    hour = ts.replace(minute=0, second=0, microsecond=0)
    hour_end = hour + timedelta(hours=1)
    rid = _reading_id(doc)
    soil = _finite(doc.get("soil_moisture", doc.get("soilMoisture")))
    temp = _finite(doc.get("temperature"))
    hum = _finite(doc.get("humidity"))
    tds = _finite(doc.get("TDS", doc.get("tds_ppm")))
    if temp == 0 and hum == 0:
        temp = None
        hum = None
    values = {"soil_moisture": soil, "temperature": temp, "humidity": hum, "tds": tds}
    rain = _finite(doc.get("raindata", doc.get("rain_status")))
    motor_on = bool(doc.get("motor_on") is True or doc.get("motor") is True)
    valid = any(v is not None for v in values.values())

    for profile in targets:
        farmer_id = str(profile.get("farmer_id") or profile.get("userId") or "")
        field_id = str(profile.get("field_id") or profile.get("_id"))
        if not farmer_id:
            continue
        filt = {"farmer_id": farmer_id, "field_id": field_id, "hour_start": hour}
        existing = db["sensor_hourly"].find_one(filt)
        if existing and existing.get("last_reading_id") == rid:
            continue

        inc: Dict[str, Any] = {"valid_readings": 1 if valid else 0, "sample_count": 1}
        sets: Dict[str, Any] = {
            "last_reading_id": rid,
            "last_seen": ts,
            "updatedAt": datetime.now(timezone.utc),
            "last_motor_on": motor_on,
        }
        set_insert = {
            "farmer_id": farmer_id,
            "field_id": field_id,
            "device_id": device_id,
            "hour_start": hour,
            "hour_end": hour_end,
            "date": ts.astimezone().strftime("%Y-%m-%d"),
            "timezone": profile.get("timezone") or "Asia/Kolkata",
            "crop": (profile.get("cropCycles") or [{}])[-1].get("crop") if profile.get("cropCycles") else profile.get("crop"),
            "crop_cycle_id": (profile.get("cropCycles") or [{}])[-1].get("id") if profile.get("cropCycles") else None,
            "rain_detections": 0,
            "motor_on_events": 0,
            "motor_off_events": 0,
            "missing_minutes": 0,
            "createdAt": datetime.now(timezone.utc),
        }
        for key, val in values.items():
            if val is None:
                continue
            inc[f"{key}.n"] = 1
            inc[f"{key}.sum"] = val
            prev = (existing or {}).get(key) or {}
            n = (prev.get("n") or 0) + 1
            s = (prev.get("sum") or 0) + val
            sets[f"{key}.min"] = val if prev.get("min") is None else min(prev["min"], val)
            sets[f"{key}.max"] = val if prev.get("max") is None else max(prev["max"], val)
            sets[f"{key}.avg"] = round(s / n, 1)

        last_seen = existing.get("last_seen") if existing else None
        if isinstance(last_seen, datetime):
            gap = (ts - last_seen).total_seconds() / 60.0
            if gap > 12:
                inc["missing_minutes"] = int(gap)
        if rain is not None and rain >= 20:
            inc["rain_detections"] = 1
            db["sensor_events"].insert_one(
                {"farmer_id": farmer_id, "field_id": field_id, "type": "rain", "timestamp": ts, "payload": {"rain": rain}}
            )
        prev_motor = existing.get("last_motor_on") if existing else None
        if isinstance(prev_motor, bool) and prev_motor != motor_on:
            inc["motor_on_events" if motor_on else "motor_off_events"] = 1
            db["sensor_events"].insert_one(
                {
                    "farmer_id": farmer_id,
                    "field_id": field_id,
                    "type": "motor_on" if motor_on else "motor_off",
                    "timestamp": ts,
                    "payload": {"soil_moisture": soil, "tds": tds},
                }
            )

        db["sensor_hourly"].update_one(filt, {"$setOnInsert": set_insert, "$set": sets, "$inc": inc}, upsert=True)
