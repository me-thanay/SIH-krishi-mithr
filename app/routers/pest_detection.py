from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any
import base64
import json

router = APIRouter()

@router.post("/detect")
async def detect_pest(file: UploadFile = File(...)):
    """Detect pests from uploaded image"""
    try:
        # Read image file
        contents = await file.read()
        
        # Mock pest detection result
        mock_result = {
            "detected_pests": [
                {
                    "name": "Aphids",
                    "confidence": 0.85,
                    "description": "Small sap-sucking insects",
                    "treatment": "Use neem oil spray or insecticidal soap",
                    "severity": "Medium"
                }
            ],
            "recommendations": [
                "Apply neem oil treatment",
                "Monitor plant health daily",
                "Consider introducing beneficial insects"
            ],
            "image_processed": True
        }
        
        return mock_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pests")
async def list_pests():
    """List all known pests"""
    try:
        pests = [
            {
                "id": 1,
                "name": "Aphids",
                "description": "Small sap-sucking insects",
                "common_crops": ["Tomato", "Pepper", "Cabbage"],
                "treatment": "Neem oil, insecticidal soap"
            },
            {
                "id": 2,
                "name": "Whiteflies",
                "description": "Small white flying insects",
                "common_crops": ["Tomato", "Cucumber", "Eggplant"],
                "treatment": "Yellow sticky traps, neem oil"
            }
        ]
        return {"pests": pests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pest/{pest_name}")
async def get_pest_info(pest_name: str):
    """Get detailed information about a specific pest"""
    try:
        pest_info = {
            "name": pest_name,
            "description": "Detailed pest information",
            "lifecycle": "Egg -> Nymph -> Adult",
            "damage_symptoms": "Yellowing leaves, stunted growth",
            "prevention": "Regular monitoring, proper spacing",
            "treatment": "Organic pesticides, beneficial insects"
        }
        return pest_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
