from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class ToolInquiry(BaseModel):
    tool_id: int
    name: str
    contact: str
    message: str

@router.get("/tools")
async def search_tools(category: str = "all", location: str = "all"):
    """Search for farming tools"""
    try:
        tools = [
            {
                "id": 1,
                "name": "Tractor",
                "category": "Heavy Equipment",
                "price_range": "₹5,00,000 - ₹15,00,000",
                "availability": "Available for rent",
                "location": "Mumbai",
                "description": "Modern tractor for field operations",
                "features": ["4WD", "Power Steering", "Air Conditioning"]
            },
            {
                "id": 2,
                "name": "Seed Drill",
                "category": "Planting Equipment",
                "price_range": "₹50,000 - ₹1,50,000",
                "availability": "Available for purchase",
                "location": "Delhi",
                "description": "Precision seed planting equipment",
                "features": ["Adjustable depth", "Multiple row capacity"]
            },
            {
                "id": 3,
                "name": "Sprayer",
                "category": "Spraying Equipment",
                "price_range": "₹25,000 - ₹75,000",
                "availability": "Available for rent",
                "location": "Bangalore",
                "description": "Backpack sprayer for crop protection",
                "features": ["Adjustable nozzle", "Large capacity tank"]
            }
        ]
        return {"tools": tools, "total": len(tools)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools/{tool_id}")
async def get_tool_details(tool_id: int):
    """Get detailed information about a specific tool"""
    try:
        tool = {
            "id": tool_id,
            "name": "Tractor",
            "category": "Heavy Equipment",
            "description": "Modern tractor for field operations",
            "specifications": {
                "engine_power": "45 HP",
                "fuel_type": "Diesel",
                "transmission": "Manual",
                "weight": "2500 kg"
            },
            "pricing": {
                "purchase_price": "₹8,00,000",
                "rental_daily": "₹2,500",
                "rental_weekly": "₹15,000",
                "rental_monthly": "₹50,000"
            },
            "availability": {
                "status": "Available",
                "location": "Mumbai",
                "contact": "+91 98765 43210"
            },
            "features": [
                "4WD capability",
                "Power steering",
                "Air conditioning",
                "Hydraulic system"
            ],
            "reviews": [
                {
                    "rating": 4.5,
                    "comment": "Excellent machine, very reliable",
                    "user": "Farmer123"
                }
            ]
        }
        return tool
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_tool_categories():
    """Get all tool categories"""
    try:
        categories = [
            {
                "id": 1,
                "name": "Heavy Equipment",
                "description": "Tractors, harvesters, and large machinery",
                "tool_count": 15
            },
            {
                "id": 2,
                "name": "Planting Equipment",
                "description": "Seed drills, planters, and transplanters",
                "tool_count": 8
            },
            {
                "id": 3,
                "name": "Spraying Equipment",
                "description": "Sprayers, dusters, and application equipment",
                "tool_count": 12
            },
            {
                "id": 4,
                "name": "Irrigation Equipment",
                "description": "Pumps, sprinklers, and drip systems",
                "tool_count": 20
            }
        ]
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_tool_recommendations(crop_type: str = "tomato", farm_size: str = "small"):
    """Get tool recommendations based on crop and farm size"""
    try:
        recommendations = [
            {
                "tool": "Seed Drill",
                "reason": "Efficient planting for tomato crops",
                "priority": "High",
                "estimated_cost": "₹75,000"
            },
            {
                "tool": "Sprayer",
                "reason": "Essential for pest and disease control",
                "priority": "High",
                "estimated_cost": "₹35,000"
            },
            {
                "tool": "Drip Irrigation System",
                "reason": "Water-efficient irrigation for tomatoes",
                "priority": "Medium",
                "estimated_cost": "₹25,000"
            }
        ]
        return {
            "crop_type": crop_type,
            "farm_size": farm_size,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/inquiry")
async def create_tool_inquiry(inquiry: ToolInquiry):
    """Create an inquiry for a specific tool"""
    try:
        inquiry_response = {
            "id": 1,
            "tool_id": inquiry.tool_id,
            "name": inquiry.name,
            "contact": inquiry.contact,
            "message": inquiry.message,
            "status": "Pending",
            "created_at": "2024-01-15T10:30:00Z"
        }
        return {
            "message": "Inquiry created successfully",
            "inquiry": inquiry_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
