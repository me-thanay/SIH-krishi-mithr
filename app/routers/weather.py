from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional

from app.services.openmeteo import (
    farming_conditions,
    farming_recommendation,
    fetch_forecast,
    resolve_location,
    weather_description,
)

router = APIRouter()


def _current_payload(location: dict, raw: dict) -> Dict[str, Any]:
    cur = raw.get("current") or {}
    temp = cur.get("temperature_2m")
    humidity = cur.get("relative_humidity_2m")
    precip = cur.get("precipitation") or cur.get("rain") or 0.0
    wind = cur.get("wind_speed_10m")
    code = cur.get("weather_code")
    description = weather_description(code)

    # Nearest-hour ET0 if available
    et0 = None
    hourly = raw.get("hourly") or {}
    if hourly.get("et0_fao_evapotranspiration"):
        et0 = hourly["et0_fao_evapotranspiration"][0]

    recommendation = farming_recommendation(temp, humidity, precip, wind, et0)
    conditions = farming_conditions(temp, humidity, precip)

    return {
        "city": location.get("name"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "temperature": round(temp, 1) if temp is not None else None,
        "humidity": round(humidity) if humidity is not None else None,
        "wind_speed": round(wind, 1) if wind is not None else None,
        "wind_direction": cur.get("wind_direction_10m"),
        "wind_gusts": cur.get("wind_gusts_10m"),
        "description": description,
        "weather_code": code,
        "feels_like": cur.get("apparent_temperature"),
        "pressure": cur.get("pressure_msl") or cur.get("surface_pressure"),
        "cloud_cover": cur.get("cloud_cover"),
        "precipitation": precip,
        "rain": cur.get("rain"),
        "is_day": cur.get("is_day"),
        "recommendation": recommendation,
        "farming_conditions": conditions,
        "et0_fao_evapotranspiration": et0,
        "source": "Open-Meteo",
        "timezone": raw.get("timezone"),
        "time": cur.get("time"),
    }


def _forecast_days(raw: dict, days: int) -> List[Dict[str, Any]]:
    daily = raw.get("daily") or {}
    times = daily.get("time") or []
    out: List[Dict[str, Any]] = []
    for i, date in enumerate(times[:days]):
        code = (daily.get("weather_code") or [None])[i] if i < len(daily.get("weather_code") or []) else None
        tmax = (daily.get("temperature_2m_max") or [None])[i] if i < len(daily.get("temperature_2m_max") or []) else None
        tmin = (daily.get("temperature_2m_min") or [None])[i] if i < len(daily.get("temperature_2m_min") or []) else None
        precip = (daily.get("precipitation_sum") or [None])[i] if i < len(daily.get("precipitation_sum") or []) else None
        precip_prob = (
            (daily.get("precipitation_probability_max") or [None])[i]
            if i < len(daily.get("precipitation_probability_max") or [])
            else None
        )
        et0 = (
            (daily.get("et0_fao_evapotranspiration") or [None])[i]
            if i < len(daily.get("et0_fao_evapotranspiration") or [])
            else None
        )
        desc = weather_description(code)
        avg_temp = None
        if tmax is not None and tmin is not None:
            avg_temp = round((tmax + tmin) / 2, 1)
        elif tmax is not None:
            avg_temp = tmax

        out.append(
            {
                "date": date,
                "temperature": avg_temp,
                "max_temp": tmax,
                "min_temp": tmin,
                "description": desc,
                "condition": desc,
                "precipitation": precip,
                "precipitation_probability": precip_prob,
                "et0_fao_evapotranspiration": et0,
                "uv_index_max": (daily.get("uv_index_max") or [None])[i]
                if i < len(daily.get("uv_index_max") or [])
                else None,
                "recommendation": farming_recommendation(avg_temp, None, precip, None, et0),
            }
        )
    return out


def _hourly_rows(raw: dict, limit: int = 48) -> List[Dict[str, Any]]:
    hourly = raw.get("hourly") or {}
    times = hourly.get("time") or []
    keys = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation_probability",
        "precipitation",
        "rain",
        "weather_code",
        "cloud_cover",
        "et0_fao_evapotranspiration",
        "vapour_pressure_deficit",
        "wind_speed_10m",
        "wind_gusts_10m",
        "soil_temperature_0cm",
        "soil_temperature_6cm",
        "soil_moisture_0_to_1cm",
        "soil_moisture_1_to_3cm",
        "soil_moisture_3_to_9cm",
        "uv_index",
        "is_day",
    ]
    rows: List[Dict[str, Any]] = []
    for i, t in enumerate(times[:limit]):
        row: Dict[str, Any] = {"time": t}
        for key in keys:
            series = hourly.get(key) or []
            row[key] = series[i] if i < len(series) else None
        if row.get("weather_code") is not None:
            row["description"] = weather_description(row["weather_code"])
        rows.append(row)
    return rows


def _alerts(current: Dict[str, Any], forecast: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    alerts: List[Dict[str, Any]] = []
    precip = current.get("precipitation") or 0
    if precip >= 5 or (forecast and (forecast[0].get("precipitation") or 0) >= 10):
        alerts.append(
            {
                "type": "Rain Alert",
                "severity": "Medium" if precip < 15 else "High",
                "message": "Significant rainfall in the forecast window.",
                "recommendation": "Cover sensitive crops and check field drainage.",
            }
        )
    temp = current.get("temperature")
    if temp is not None and temp >= 38:
        alerts.append(
            {
                "type": "Heat Alert",
                "severity": "High",
                "message": f"Air temperature is {temp}°C.",
                "recommendation": "Irrigate early/late and avoid midday spraying.",
            }
        )
    if temp is not None and temp <= 10:
        alerts.append(
            {
                "type": "Cold Alert",
                "severity": "Medium",
                "message": f"Air temperature is {temp}°C.",
                "recommendation": "Protect seedlings from cold stress.",
            }
        )
    gusts = current.get("wind_gusts") or current.get("wind_speed") or 0
    if gusts >= 45:
        alerts.append(
            {
                "type": "Wind Alert",
                "severity": "Medium",
                "message": f"Strong winds around {gusts} km/h.",
                "recommendation": "Secure covers; delay foliar sprays.",
            }
        )
    return alerts


@router.get("/current")
async def get_current_weather(
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    """Current conditions from Open-Meteo (by city name or lat/lon)."""
    try:
        location = await resolve_location(city=city, lat=lat, lon=lon)
        raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=2)
        return _current_payload(location, raw)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {exc}")


@router.get("/forecast")
async def get_weather_forecast(
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    days: int = Query(5, ge=1, le=16),
):
    """Daily forecast for farming decisions."""
    try:
        location = await resolve_location(city=city, lat=lat, lon=lon)
        raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=days)
        current = _current_payload(location, raw)
        forecast = _forecast_days(raw, days)
        return {
            "city": location.get("name"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "current": current,
            "forecast": forecast,
            "source": "Open-Meteo",
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {exc}")


@router.get("/hourly")
async def get_hourly_weather(
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    hours: int = Query(48, ge=1, le=168),
):
    """Hourly series including soil moisture / ET0 for irrigation planning."""
    try:
        location = await resolve_location(city=city, lat=lat, lon=lon)
        raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=7)
        return {
            "city": location.get("name"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "hourly": _hourly_rows(raw, limit=hours),
            "source": "Open-Meteo",
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {exc}")


@router.get("/soil")
async def get_soil_forecast(
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    """Soil temperature / moisture from Open-Meteo (model estimate, not your ESP sensors)."""
    try:
        location = await resolve_location(city=city, lat=lat, lon=lon)
        raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=2)
        hourly = raw.get("hourly") or {}
        idx = 0
        return {
            "city": location.get("name"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "time": (hourly.get("time") or [None])[idx],
            "soil_temperature_0cm": (hourly.get("soil_temperature_0cm") or [None])[idx],
            "soil_temperature_6cm": (hourly.get("soil_temperature_6cm") or [None])[idx],
            "soil_moisture_0_to_1cm": (hourly.get("soil_moisture_0_to_1cm") or [None])[idx],
            "soil_moisture_1_to_3cm": (hourly.get("soil_moisture_1_to_3cm") or [None])[idx],
            "soil_moisture_3_to_9cm": (hourly.get("soil_moisture_3_to_9cm") or [None])[idx],
            "et0_fao_evapotranspiration": (hourly.get("et0_fao_evapotranspiration") or [None])[idx],
            "note": "Model soil moisture from Open-Meteo — your ESP soil sensor remains the ground truth on-farm.",
            "source": "Open-Meteo",
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {exc}")


@router.get("/alerts")
async def get_weather_alerts(
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    """Simple farming weather alerts derived from Open-Meteo current + daily forecast."""
    try:
        location = await resolve_location(city=city, lat=lat, lon=lon)
        raw = await fetch_forecast(location["latitude"], location["longitude"], forecast_days=3)
        current = _current_payload(location, raw)
        forecast = _forecast_days(raw, 3)
        return {
            "city": location.get("name"),
            "alerts": _alerts(current, forecast),
            "source": "Open-Meteo",
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {exc}")
