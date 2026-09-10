from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

@router.get("/current")
async def get_current_weather(city: str = "Mumbai"):
    """Get current weather for a city"""
    try:
        # Mock weather data for now
        mock_weather = {
            "city": city,
            "temperature": 28,
            "humidity": 65,
            "wind_speed": 12,
            "description": "Partly cloudy",
            "recommendation": "Good conditions for crop growth. Consider light irrigation."
        }
        return mock_weather
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
async def get_weather_forecast(city: str = "Mumbai", days: int = 5):
    """Get weather forecast for a city"""
    try:
        # Mock forecast data
        forecast = []
        for i in range(days):
            forecast.append({
                "date": f"Day {i+1}",
                "temperature": 25 + i,
                "humidity": 60 + i*2,
                "description": "Sunny" if i % 2 == 0 else "Cloudy",
                "recommendation": "Ideal for planting" if i % 2 == 0 else "Monitor soil moisture"
            })
        return {"city": city, "forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_weather_alerts(city: str = "Mumbai"):
    """Get weather alerts for a city"""
    try:
        alerts = [
            {
                "type": "Rain Alert",
                "severity": "Medium",
                "message": "Heavy rainfall expected in next 24 hours",
                "recommendation": "Cover crops and check drainage"
            }
        ]
        return {"city": city, "alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
