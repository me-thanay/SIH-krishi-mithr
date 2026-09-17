"""Mongo helpers for ESP32-CAM diagnose scans (optional if DATABASE_URL is unset)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import urlparse

_client = None


def get_db():
    """Return the krishi-mithr database or None when Mongo is not configured."""
    uri = (os.getenv("DATABASE_URL") or "").strip()
    if not uri.startswith("mongodb"):
        return None
    try:
        from pymongo import MongoClient
    except ImportError:
        return None

    global _client
    if _client is None:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)

    parsed = urlparse(uri)
    name = (parsed.path or "").lstrip("/").split("?")[0]
    return _client[name or "krishi-mithr"]


def save_camera_scan(doc: dict[str, Any]) -> Optional[str]:
    db = get_db()
    if db is None:
        return None
    payload = dict(doc)
    payload["timestamp"] = payload.get("timestamp") or datetime.now(timezone.utc)
    result = db["camera_scans"].insert_one(payload)
    device_id = payload.get("device_id") or "esp32-cam"
    count = db["camera_scans"].count_documents({"device_id": device_id})
    if count > 100:
        old = list(
            db["camera_scans"]
            .find({"device_id": device_id}, {"_id": 1})
            .sort("timestamp", 1)
            .limit(count - 100)
        )
        if old:
            db["camera_scans"].delete_many({"_id": {"$in": [d["_id"] for d in old]}})
    return str(result.inserted_id)


def latest_camera_scan(device_id: Optional[str] = None) -> Optional[dict[str, Any]]:
    db = get_db()
    if db is None:
        return None
    query: dict[str, Any] = {}
    if device_id:
        query["device_id"] = device_id
    doc = db["camera_scans"].find_one(query, sort=[("timestamp", -1)])
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    ts = doc.get("timestamp")
    if hasattr(ts, "isoformat"):
        doc["timestamp"] = ts.isoformat()
    return doc
