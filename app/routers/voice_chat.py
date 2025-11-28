from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import requests
import json
from datetime import datetime

router = APIRouter()

@router.post("/send-message")
async def send_voice_message(message_data: Dict[str, Any]):
    """Send voice text to WhatsApp bot and get response"""
    try:
        # Extract the voice text from the request
        voice_text = message_data.get("text", "")
        user_id = message_data.get("user_id", "voice_user")
        
        if not voice_text:
            raise HTTPException(status_code=400, detail="No text provided")
        # Simulate WhatsApp bot response based on voice input
        # In a real implementation, this would send to actual WhatsApp Business API
        response = generate_whatsapp_response(voice_text)
        
        return {
            "success": True,
            "user_id": user_id,
            "voice_text": voice_text,
            "bot_response": response,
            "timestamp": datetime.now().isoformat(),
            "message_id": f"VOICE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_whatsapp_response(voice_text: str) -> str:
    """Generate WhatsApp bot response based on voice input"""
    text_lower = voice_text.lower()
    
    
    # Weather queries
    if any(word in text_lower for word in ["weather", "temperature", "rain", "sunny", "cloudy"]):
        return "🌤️ Weather Update: Current temperature is 28°C with partly cloudy skies. Good conditions for crop growth. Consider light irrigation if soil is dry."
    
    # Soil queries
    elif any(word in text_lower for word in ["soil", "fertilizer", "nutrient", "ph"]):
        return "🌱 Soil Analysis: For comprehensive soil analysis, please upload a soil image through our website. I can help with general soil health tips and fertilizer recommendations."
    
    # Crop queries
    elif any(word in text_lower for word in ["crop", "plant", "seed", "harvest"]):
        return "🌾 Crop Advisory: Based on current season, consider planting tomatoes, peppers, or leafy vegetables. Ensure proper irrigation and pest monitoring."
    
    # Market price queries
    elif any(word in text_lower for word in ["price", "market", "sell", "buy", "cost"]):
        return "💰 Market Prices: Current wheat price: ₹2,200/quintal, Rice: ₹3,100/quintal, Tomatoes: ₹45/kg. Check our website for detailed price trends and forecasts."
    
    # Pest and disease queries
    elif any(word in text_lower for word in ["pest", "disease", "bug", "insect", "fungus"]):
        return "🐛 Pest Control: For pest identification, upload a photo of the affected plant. Common solutions include neem oil spray, proper irrigation, and crop rotation."
    
    # General farming queries
    elif any(word in text_lower for word in ["farming", "agriculture", "farm", "field"]):
        return "🚜 Farming Tips: Maintain soil health with organic matter, practice crop rotation, monitor weather conditions, and use integrated pest management."
    
    # Help queries
    elif any(word in text_lower for word in ["help", "assistance", "support", "guide"]):
        return "🤝 How can I help? I can assist with:\n• Weather updates\n• Soil analysis\n• Crop recommendations\n• Market prices\n• Pest identification\n• Farming tips\n\nJust ask me anything about farming!"
    
    # Greeting queries
    elif any(word in text_lower for word in ["hello", "hi", "namaste", "good morning", "good afternoon"]):
        return "👋 Hello! I'm your AI farming assistant. How can I help you with your agricultural needs today?"
    
    # Default response
    else:
        return "🤖 I understand you said: '" + voice_text + "'. Could you please be more specific about your farming question? I can help with weather, soil, crops, market prices, or pest control."
