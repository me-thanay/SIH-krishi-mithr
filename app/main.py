from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

from app.routers import weather, pest_detection, soil_advisory, market_prices, dealer_network, farming_tools, whatsapp_webhook, voice_chat

load_dotenv()

app = FastAPI(
    title="Smart AgriTech API",
    description="AI-Powered Agricultural Advisory Platform",
    version="1.0.0"
)

# CORS middleware
# Allow all Vercel preview and production domains
# Vercel uses patterns like: *.vercel.app for previews and custom domains for production
allowed_origins = [
    "https://krishi-mithr.vercel.app",
    "https://sih-krishi-mithr.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
]

# Add any additional origins from environment variable
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

# For production, allow all origins to handle Vercel preview URLs
# Vercel generates unique preview URLs that we can't predict
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins to handle Vercel preview URLs
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(pest_detection.router, prefix="/api/pest", tags=["pest-detection"])
app.include_router(soil_advisory.router, prefix="/api/soil", tags=["soil-advisory"])
app.include_router(market_prices.router, tags=["market-prices"])
app.include_router(dealer_network.router, prefix="/api/dealers", tags=["dealer-network"])
app.include_router(farming_tools.router, prefix="/api/tools", tags=["farming-tools"])
app.include_router(whatsapp_webhook.router, prefix="/api/webhook", tags=["whatsapp"])
app.include_router(voice_chat.router, prefix="/api/voice", tags=["voice-chat"])

@app.get("/")
async def root():
    return {
        "message": "Smart AgriTech API",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "Live Weather Updates",
            "Pest Detection",
            "Soil Advisory",
            "Market Prices",
            "Dealer Network",
            "Farming Tools Marketplace",
            "WhatsApp Bot Integration"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "All services operational"}

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "OK"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
