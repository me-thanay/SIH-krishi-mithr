"""XGBoost farm advisory API — irrigation, stress, disease climate, motor, yield, price."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import threading

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

_advisor = None
_advisor_error: Optional[str] = None
_lock = threading.Lock()


def _get_advisor():
    global _advisor, _advisor_error
    if _advisor is not None:
        return _advisor
    with _lock:
        if _advisor is None and _advisor_error is None:
            try:
                from ml.xgboost_advisor import XGBoostAdvisor

                _advisor = XGBoostAdvisor()
            except Exception as exc:
                _advisor_error = f"{type(exc).__name__}: {exc}"
        if _advisor is None:
            raise HTTPException(status_code=503, detail=f"XGBoost advisor unavailable. {_advisor_error}")
        return _advisor


async def _latest_sensor() -> Dict[str, Any]:
    try:
        from app.camera_scans import get_db

        db = get_db()
        if db is None:
            return {}
        doc = db["sensor_readings"].find_one(sort=[("timestamp", -1)])
        if not doc:
            return {}
        doc.pop("_id", None)
        return doc
    except Exception:
        return {}


async def _weather_bundle(city: Optional[str], lat: Optional[float], lon: Optional[float]) -> Dict[str, Any]:
    from app.services.openmeteo import fetch_forecast, resolve_location

    location = await resolve_location(city=city, lat=lat, lon=lon)
    raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=2)
    cur = raw.get("current") or {}
    hourly = raw.get("hourly") or {}
    weather = {
        "temperature": cur.get("temperature_2m"),
        "humidity": cur.get("relative_humidity_2m"),
        "precipitation": cur.get("precipitation") or cur.get("rain") or 0.0,
        "wind_speed": cur.get("wind_speed_10m"),
        "et0_fao_evapotranspiration": (hourly.get("et0_fao_evapotranspiration") or [None])[0],
        "uv_index": (hourly.get("uv_index") or [None])[0],
        "soil_moisture_0_to_1cm": (hourly.get("soil_moisture_0_to_1cm") or [None])[0],
        "soil_temperature_0cm": (hourly.get("soil_temperature_0cm") or [None])[0],
        "precipitation_probability": (hourly.get("precipitation_probability") or [None])[0],
        "city": location.get("name"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
    }
    return weather


class AdvisoryRequest(BaseModel):
    city: Optional[str] = "Hyderabad"
    lat: Optional[float] = None
    lon: Optional[float] = None
    sensor: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional sensor overrides; otherwise latest Mongo sensor_readings is used",
    )


@router.get("/status")
async def advisory_status():
    try:
        advisor = _get_advisor()
        return {"loaded": True, "models": list(advisor.bundles.keys()), "error": None}
    except HTTPException as exc:
        return {"loaded": False, "models": [], "error": exc.detail}


@router.post("/predict")
async def predict_advisory(body: AdvisoryRequest):
    """Run all XGBoost advisory heads on sensors + Open-Meteo weather."""
    advisor = _get_advisor()
    now = datetime.now(timezone.utc).astimezone()
    sensor = body.sensor if body.sensor is not None else await _latest_sensor()
    try:
        weather = await _weather_bundle(body.city, body.lat, body.lon)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {exc}")

    result = advisor.predict(sensor=sensor, weather=weather, hour=now.hour, month=now.month)
    result["inputs"] = {
        "sensor_used": bool(sensor),
        "weather_city": weather.get("city"),
        "latitude": weather.get("latitude"),
        "longitude": weather.get("longitude"),
    }
    result["sensor_snapshot"] = {
        k: sensor.get(k)
        for k in (
            "temperature",
            "humidity",
            "soil_moisture",
            "TDS",
            "CO2_ppm",
            "light",
            "motion_detected",
            "timestamp",
        )
        if sensor
    }
    result["weather_snapshot"] = weather
    return result


@router.get("/predict")
async def predict_advisory_get(
    city: Optional[str] = Query("Hyderabad"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    return await predict_advisory(AdvisoryRequest(city=city, lat=lat, lon=lon))
