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

# CORS middleware - MUST be added before routers
# Allow all origins to handle Vercel preview URLs and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using ["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

# Include routers
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(pest_detection.router, prefix="/api/pest", tags=["pest-detection"])
app.include_router(soil_advisory.router, prefix="/api/soil", tags=["soil-advisory"])
app.include_router(market_prices.router, prefix="/api", tags=["market-prices"])
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
