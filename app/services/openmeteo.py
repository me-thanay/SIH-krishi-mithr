"""Open-Meteo client for farm weather (no API key).

Uses the public forecast + geocoding APIs. Intentionally requests a practical
subset of variables — not every pressure level / ensemble model.
"""

from __future__ import annotations

from typing import Any, Optional

import httpx

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"

# WMO Weather interpretation codes (WW)
WEATHER_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

CITY_COORDS: dict[str, tuple[float, float]] = {
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.7041, 77.1025),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "nagpur": (21.1458, 79.0882),
    "indore": (22.7196, 75.8577),
    "bhopal": (23.2599, 77.4126),
    "visakhapatnam": (17.6868, 83.2185),
    "patna": (25.5941, 85.1376),
    "agra": (27.1767, 78.0081),
    "ludhiana": (30.9010, 75.8573),
}


def weather_description(code: Optional[int]) -> str:
    if code is None:
        return "Unknown"
    return WEATHER_CODES.get(int(code), f"Weather code {code}")


def farming_recommendation(
    temperature: Optional[float],
    humidity: Optional[float],
    precipitation: Optional[float],
    wind_speed: Optional[float] = None,
    et0: Optional[float] = None,
) -> str:
    tips: list[str] = []
    rain = precipitation or 0.0
    temp = temperature if temperature is not None else 28.0
    hum = humidity if humidity is not None else 60.0

    if rain >= 5:
        tips.append("Rain expected or falling — pause irrigation and check drainage.")
    elif rain > 0:
        tips.append("Light rain possible — reduce irrigation today.")
    elif hum < 40 or (et0 is not None and et0 > 5):
        tips.append("Dry air / high evaporative demand — irrigate sensitive crops.")
    else:
        tips.append("Moisture outlook is moderate - irrigate based on soil sensors.")

    if temp < 15:
        tips.append("Cool conditions — growth may slow; protect tender seedlings.")
    elif temp > 38:
        tips.append("Heat stress risk — irrigate early morning/evening and provide shade if possible.")
    elif 20 <= temp <= 32:
        tips.append("Temperature is favourable for most field crops.")

    if wind_speed and wind_speed > 40:
        tips.append("Strong winds — secure covers and delay pesticide spraying.")

    return " ".join(tips)


def farming_conditions(
    temperature: Optional[float],
    humidity: Optional[float],
    precipitation: Optional[float],
) -> dict[str, bool]:
    rain = precipitation or 0.0
    temp = temperature if temperature is not None else 28.0
    hum = humidity if humidity is not None else 60.0
    return {
        "irrigation_needed": rain < 1 and (hum < 45 or temp > 34),
        "good_growing": 18 <= temp <= 34 and rain < 15,
        "planting_suitable": 20 <= temp <= 32 and rain < 8,
    }


async def geocode_city(city: str) -> dict[str, Any]:
    key = city.strip().lower()
    if key in CITY_COORDS:
        lat, lon = CITY_COORDS[key]
        return {"name": city.title(), "latitude": lat, "longitude": lon, "country": "India"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            GEOCODE_URL,
            params={"name": city, "count": 1, "language": "en", "format": "json"},
        )
        resp.raise_for_status()
        data = resp.json()
    results = data.get("results") or []
    if not results:
        raise ValueError(f"Could not find location for '{city}'")
    hit = results[0]
    return {
        "name": hit.get("name") or city,
        "latitude": float(hit["latitude"]),
        "longitude": float(hit["longitude"]),
        "country": hit.get("country"),
        "admin1": hit.get("admin1"),
    }


async def resolve_location(
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> dict[str, Any]:
    if lat is not None and lon is not None:
        return {
            "name": city or f"{lat:.3f},{lon:.3f}",
            "latitude": float(lat),
            "longitude": float(lon),
        }
    if city:
        return await geocode_city(city)
    return await geocode_city("Mumbai")


async def fetch_forecast(
    latitude: float,
    longitude: float,
    forecast_days: int = 7,
) -> dict[str, Any]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "forecast_days": max(1, min(int(forecast_days), 16)),
        "current": ",".join(
            [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "rain",
                "showers",
                "weather_code",
                "cloud_cover",
                "pressure_msl",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
            ]
        ),
        "hourly": ",".join(
            [
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
        ),
        "daily": ",".join(
            [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "et0_fao_evapotranspiration",
                "uv_index_max",
            ]
        ),
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(FORECAST_URL, params=params)
        resp.raise_for_status()
        return resp.json()
