"""In-memory + optional Mongo store for latest ESP32 / MQTT sensor reading."""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_lock = threading.Lock()
_latest: Dict[str, Any] = {}


def normalize_goa_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """Map Goa ESP32 JSON keys onto SIH sensor_readings / XGBoost names."""
    out = dict(data or {})
    if out.get("TDS") is None and out.get("tds_ppm") is not None:
        out["TDS"] = out["tds_ppm"]
    if out.get("soil_moisture") is None and out.get("soilMoisture") is not None:
        out["soil_moisture"] = out["soilMoisture"]
    # motion may be 0/1 int from ESP
    if "motion_detected" not in out and out.get("motion") is not None:
        m = out["motion"]
        out["motion_detected"] = m in (1, "1", True, "true", "HIGH")
    out.setdefault("device_id", "esp32_goa")
    out.setdefault("location", "farm_field_1")
    out["timestamp"] = datetime.now(timezone.utc)
    return out


def set_latest(data: Dict[str, Any]) -> Dict[str, Any]:
    doc = normalize_goa_payload(data)
    with _lock:
        _latest.clear()
        _latest.update(doc)
    return doc


def get_latest() -> Optional[Dict[str, Any]]:
    with _lock:
        return dict(_latest) if _latest else None
