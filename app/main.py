from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
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
# Note: Using middleware function instead of CORSMiddleware with "*" for better compatibility
# CORSMiddleware with "*" doesn't work well, so we use a custom middleware

# Add OPTIONS handler BEFORE routers to catch all OPTIONS requests
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle OPTIONS requests for CORS preflight - catch all"""
    from fastapi.responses import Response
    origin = request.headers.get("origin", "*")
    
    response = Response(status_code=200)
    response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "false"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

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

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Add CORS headers to all responses"""
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        origin = request.headers.get("origin", "*")
        
        response = Response()
        # Allow all origins for CORS
        response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "false"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response
    
    # For all other requests, add CORS headers to response
    response = await call_next(request)
    
    # Get origin from request
    origin = request.headers.get("origin", "*")
    
    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "false"
    response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
