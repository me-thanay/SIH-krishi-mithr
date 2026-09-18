"""Shared feature schema for XGBoost farm advisory models."""

from __future__ import annotations

from typing import Any, Mapping

FEATURE_NAMES: list[str] = [
    # On-farm sensors (ESP / MQTT)
    "temperature",
    "humidity",
    "soil_moisture",
    "tds",
    "co2_ppm",
    "nh3_ppm",
    "benzene_ppm",
    "smoke_ppm",
    "light",
    "motion",
    # Open-Meteo / weather
    "weather_temp",
    "weather_humidity",
    "precipitation",
    "precip_probability",
    "wind_speed",
    "et0",
    "uv_index",
    "soil_moisture_model",
    "soil_temp_model",
    # Calendar
    "hour",
    "month",
]

DEFAULTS: dict[str, float] = {
    "temperature": 28.0,
    "humidity": 60.0,
    "soil_moisture": 45.0,
    "tds": 400.0,
    "co2_ppm": 420.0,
    "nh3_ppm": 5.0,
    "benzene_ppm": 1.0,
    "smoke_ppm": 2.0,
    "light": 1.0,
    "motion": 0.0,
    "weather_temp": 28.0,
    "weather_humidity": 60.0,
    "precipitation": 0.0,
    "precip_probability": 10.0,
    "wind_speed": 8.0,
    "et0": 3.0,
    "uv_index": 6.0,
    "soil_moisture_model": 0.25,
    "soil_temp_model": 26.0,
    "hour": 12.0,
    "month": 6.0,
}


def _num(value: Any, fallback: float) -> float:
    if value is None or value == "" or value == "--":
        return fallback
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def features_from_sources(
    sensor: Mapping[str, Any] | None = None,
    weather: Mapping[str, Any] | None = None,
    hour: int | None = None,
    month: int | None = None,
) -> dict[str, float]:
    """Build a flat feature dict from sensor Mongo doc + Open-Meteo current/hourly."""
    sensor = sensor or {}
    weather = weather or {}
    # Support both flat current payload and nested shapes
    wtemp = weather.get("temperature", weather.get("weather_temp", weather.get("temperature_2m")))
    whum = weather.get("humidity", weather.get("weather_humidity", weather.get("relative_humidity_2m")))

    feats = {
        "temperature": _num(sensor.get("temperature"), DEFAULTS["temperature"]),
        "humidity": _num(sensor.get("humidity"), DEFAULTS["humidity"]),
        "soil_moisture": _num(
            sensor.get("soil_moisture", sensor.get("soilMoisture", sensor.get("SoilMoisture"))),
            DEFAULTS["soil_moisture"],
        ),
        "tds": _num(sensor.get("TDS", sensor.get("tds", sensor.get("tds_ppm"))), DEFAULTS["tds"]),
        "co2_ppm": _num(sensor.get("CO2_ppm", sensor.get("co2_ppm")), DEFAULTS["co2_ppm"]),
        "nh3_ppm": _num(sensor.get("NH3_ppm", sensor.get("nh3_ppm")), DEFAULTS["nh3_ppm"]),
        "benzene_ppm": _num(sensor.get("Benzene_ppm", sensor.get("benzene_ppm")), DEFAULTS["benzene_ppm"]),
        "smoke_ppm": _num(sensor.get("Smoke_ppm", sensor.get("smoke_ppm")), DEFAULTS["smoke_ppm"]),
        "light": _num(sensor.get("light", sensor.get("LightLevel")), DEFAULTS["light"]),
        "motion": 1.0
        if sensor.get("motion_detected") in (True, 1, "1", "true")
        else _num(sensor.get("motion", sensor.get("PIR")), DEFAULTS["motion"]),
        "weather_temp": _num(wtemp, DEFAULTS["weather_temp"]),
        "weather_humidity": _num(whum, DEFAULTS["weather_humidity"]),
        "precipitation": _num(
            weather.get("precipitation", weather.get("rain")),
            DEFAULTS["precipitation"],
        ),
        "precip_probability": _num(
            weather.get("precipitation_probability", weather.get("precip_probability")),
            DEFAULTS["precip_probability"],
        ),
        "wind_speed": _num(weather.get("wind_speed", weather.get("wind_speed_10m")), DEFAULTS["wind_speed"]),
        "et0": _num(
            weather.get("et0_fao_evapotranspiration", weather.get("et0")),
            DEFAULTS["et0"],
        ),
        "uv_index": _num(weather.get("uv_index"), DEFAULTS["uv_index"]),
        "soil_moisture_model": _num(
            weather.get("soil_moisture_0_to_1cm", weather.get("soil_moisture_model")),
            DEFAULTS["soil_moisture_model"],
        ),
        "soil_temp_model": _num(
            weather.get("soil_temperature_0cm", weather.get("soil_temp_model")),
            DEFAULTS["soil_temp_model"],
        ),
        "hour": float(hour if hour is not None else DEFAULTS["hour"]),
        "month": float(month if month is not None else DEFAULTS["month"]),
    }
    return {name: float(feats[name]) for name in FEATURE_NAMES}


def vectorize(features: Mapping[str, float]) -> list[float]:
    return [float(features.get(name, DEFAULTS[name])) for name in FEATURE_NAMES]
