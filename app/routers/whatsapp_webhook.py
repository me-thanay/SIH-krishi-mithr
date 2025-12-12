from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel
import os
import requests
import json
from urllib.parse import quote
from dotenv import load_dotenv
from collections import deque
from datetime import datetime

load_dotenv()

router = APIRouter()

# In-memory store for recent WhatsApp replies (resets on restart)
recent_replies = deque(maxlen=50)

# Pydantic model for send-whatsapp request
class SendWhatsAppRequest(BaseModel):
    message: str

async def send_whatsapp_message(phone_number: str, message: str) -> bool:
    """Send message to WhatsApp using WhatsApp Business API"""
    try:
        # WhatsApp Business API configuration
        access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        
        if not access_token or not phone_number_id:
            print("WhatsApp API credentials not configured")
            return False
        
        # Format phone number (remove + and spaces)
        formatted_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "messaging_product": "whatsapp",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            print(f"Message sent successfully to {phone_number}")
            return True
        else:
            print(f"Failed to send message: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending WhatsApp message: {str(e)}")
        return False

@router.get("/whatsapp")
async def verify_webhook(request: Request) -> JSONResponse:
    """Verify WhatsApp webhook"""
    try:
        # Get query parameters
        mode = request.query_params.get("hub.mode")
        token = request.query_params.get("hub.verify_token")
        challenge = request.query_params.get("hub.challenge")
        
        # Verify the webhook
        verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "kissan_verification_token")
        
        if mode == "subscribe" and token == verify_token:
            return JSONResponse(content=int(challenge))
        else:
            raise HTTPException(status_code=403, detail="Forbidden")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request) -> JSONResponse:
    """Handle incoming WhatsApp messages"""
    try:
        payload: Dict[str, Any] = await request.json()
        
        # Process the webhook payload
        entries = payload.get("entry", [])
        changes = entries[0].get("changes", []) if entries else []
        value = changes[0].get("value", {}) if changes else {}
        messages = value.get("messages", [])
        
        response_messages = []
        
        if messages:
            for message in messages:
                from_wa = message.get("from")
                text = (message.get("text", {}) or {}).get("body") if message.get("type") == "text" else None
                image = message.get("image") if message.get("type") == "image" else None
                
                # Generate response based on message content
                reply = await generate_advisory_response(text=text, image=image)
                
                # Send message to WhatsApp if we have a phone number
                if from_wa:
                    # Format phone number for WhatsApp
                    formatted_phone = f"+{from_wa}" if not from_wa.startswith("+") else from_wa
                    await send_whatsapp_message(formatted_phone, reply)
                
                reply_obj = {
                    "to": from_wa,
                    "message": reply,
                    "type": "text",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                response_messages.append(reply_obj)
                recent_replies.appendleft(reply_obj)
        
        return JSONResponse({"status": "received", "replies": response_messages})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_advisory_response(text: Optional[str] = None, image: Optional[Dict[str, Any]] = None) -> str:
    """Generate advisory response based on user input"""
    try:
        if image is not None:
            return "Thank you for sharing the image! I can help analyze it for pest detection or soil analysis. Please specify what you'd like me to analyze."
        
        if text:
            text_lower = text.lower()
            
            # Voice-specific responses (more conversational)
            if "voice_user" in str(text):  # Special identifier for voice input
                return "I heard your voice message! Let me help you with that. Please tell me more about your farming question."
            
            # Weather-related queries
            if any(word in text_lower for word in ["weather", "rain", "sunny", "cloudy", "temperature", "humidity"]):
                return "🌤️ Weather Update: Current conditions are favorable for crop growth. Temperature: 28°C, Humidity: 65%. No immediate weather alerts. Would you like a 5-day forecast?"
            
            # Pest and disease queries
            elif any(word in text_lower for word in ["pest", "disease", "bug", "insect", "yellow", "spots", "leaves", "damage"]):
                return "🐛 Pest/Disease Help: I can help identify pests and diseases! Please share a photo of the affected plant for accurate diagnosis. Common issues include aphids, whiteflies, and fungal diseases."
            
            # Soil-related queries
            elif any(word in text_lower for word in ["soil", "fertilizer", "nutrient", "ph", "compost", "manure"]):
                return "🌱 Soil Analysis: I can analyze your soil and recommend fertilizers! Share a photo of your soil sample for analysis. I'll check pH, nutrients, and suggest improvements."
            
            # Market price queries
            elif any(word in text_lower for word in ["price", "market", "sell", "buy", "cost", "tomato", "onion", "potato"]):
                return "💰 Market Prices: Current rates - Tomato: ₹45/kg, Onion: ₹38/kg, Potato: ₹25/kg. Prices are updated daily from major markets. Which crop are you interested in?"
            
            # General help
            elif "help" in text_lower:
                return "🤖 AgriBot Help:\n• Ask about 'weather' for updates\n• Say 'pest' + photo for pest detection\n• Mention 'soil' + photo for soil analysis\n• Ask about 'price' for market rates\n• Say 'dealers' for nearby suppliers\n\nJust speak naturally - I understand your language!"
            
            # Greeting responses
            elif any(word in text_lower for word in ["hello", "hi", "hey", "namaste", "good morning", "good afternoon"]):
                return "Hello! I'm your AI farming assistant. I can help with weather updates, pest detection, soil analysis, market prices, and more. What would you like to know about your crops? 🌱"
            
            # Default response for unrecognized input
            else:
                return f"I heard you say: '{text}'. I can help with weather updates, pest detection, soil analysis, market prices, and farming advice. Could you be more specific about what you need help with? 🌱"
        
        return "Welcome to Smart AgriTech! I'm here to help with your farming questions. Just speak naturally or send a message! 🌱"
        
    except Exception as e:
        return "Sorry, I encountered an error. Please try again or contact support."

@router.post("/whatsapp/send")
async def send_test_message(phone_number: str, message: str):
    """Send a test message to WhatsApp"""
    try:
        success = await send_whatsapp_message(phone_number, message)
        if success:
            return {"status": "success", "message": f"Message sent to {phone_number}"}
        else:
            return {"status": "error", "message": "Failed to send message"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/whatsapp/send-voice")
async def send_voice_message(request: Request):
    """Send voice message to WhatsApp chatbot (automatically sends to 7670997498 with kissan prefix)"""
    try:
        body = await request.json()
        voice_text = body.get("text", "")
        
        if not voice_text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Add "kissan" prefix as required by the chatbot
        message = f"kissan {voice_text}"
        
        # Send to the chatbot number
        chatbot_number = "7670997498"
        success = await send_whatsapp_message(chatbot_number, message)
        
        if success:
            return {
                "status": "success",
                "message": "Voice message sent to WhatsApp chatbot",
                "sent_to": chatbot_number,
                "message_text": message
            }
        else:
            # If WhatsApp API is not configured, return a fallback response
            return {
                "status": "pending",
                "message": "WhatsApp API not configured. Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your .env file.",
                "fallback_url": f"https://wa.me/{chatbot_number}?text={quote(message)}"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/whatsapp/status")
async def get_webhook_status():
    """Get webhook status"""
    return {
        "status": "active",
        "message": "WhatsApp webhook is operational",
        "phone_number": "+91 76709 97498",
        "features": [
            "Text message processing",
            "Image analysis requests",
            "Weather updates",
            "Pest detection",
            "Soil analysis",
            "Market prices"
        ]
    }

@router.get("/whatsapp/recent")
async def get_recent_whatsapp_replies():
    """Expose recent WhatsApp replies for the web dashboard (non-persistent)"""
    return {
        "status": "ok",
        "count": len(recent_replies),
        "replies": list(recent_replies)
    }

@router.post("/send-whatsapp")
async def send_whatsapp(request: SendWhatsAppRequest):
    """
    Send message to WhatsApp Cloud API
    POST /send-whatsapp
    Body: { "message": "<text>" }
    """
    try:
        # Get message from request (allow empty for just "kissan")
        text = request.message.strip() if request.message else ""
        
        # Add "kissan" prefix (if text is empty, message will be just "kissan")
        message = f"kissan {text}".strip() if text else "kissan"
        
        # Get WhatsApp API credentials
        access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        target_phone = "7670997498"  # Fixed phone number
        
        if not access_token or not phone_number_id:
            raise HTTPException(
                status_code=500,
                detail="WhatsApp API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID"
            )
        
        # Format phone number (remove +, spaces, ensure starts with country code)
        formatted_phone = target_phone.replace("+", "").replace(" ", "").replace("-", "")
        if not formatted_phone.startswith("91"):
            formatted_phone = "91" + formatted_phone
        
        # WhatsApp Cloud API endpoint
        api_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        
        # Request body as specified
        payload = {
            "messaging_product": "whatsapp",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        # Send to WhatsApp Cloud API
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(api_url, headers=headers, json=payload)
        response_data = response.json()
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": "Message sent to WhatsApp successfully",
                "message_id": response_data.get("messages", [{}])[0].get("id"),
                "sent_to": formatted_phone,
                "message_text": message
            }
        else:
            error_msg = response_data.get("error", {}).get("message", "Unknown error")
            error_code = response_data.get("error", {}).get("code", "N/A")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"WhatsApp API error: {error_msg} (Code: {error_code})"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp message: {str(e)}")
