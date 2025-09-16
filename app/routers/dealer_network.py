from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class DealerRequest(BaseModel):
    location: str
    product_type: str = "all"

class DealRequest(BaseModel):
    dealer_id: int
    product_id: int
    quantity: int
    message: str

@router.get("/dealers")
async def find_dealers(location: str = "Mumbai", product_type: str = "all"):
    """Find dealers near a location"""
    try:
        dealers = [
            {
                "id": 1,
                "name": "Green Valley Seeds",
                "location": "Mumbai",
                "distance": "2.5 km",
                "rating": 4.5,
                "products": ["Seeds", "Fertilizers", "Tools"],
                "contact": "+91 98765 43210",
                "specialization": "Organic farming"
            },
            {
                "id": 2,
                "name": "FarmTech Solutions",
                "location": "Mumbai",
                "distance": "5.1 km",
                "rating": 4.2,
                "products": ["Equipment", "Pesticides", "Irrigation"],
                "contact": "+91 98765 43211",
                "specialization": "Modern farming equipment"
            }
        ]
        return {"dealers": dealers, "location": location}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dealers/{dealer_id}")
async def get_dealer_details(dealer_id: int):
    """Get detailed information about a specific dealer"""
    try:
        dealer = {
            "id": dealer_id,
            "name": "Green Valley Seeds",
            "location": "Mumbai",
            "address": "123 Farm Road, Mumbai - 400001",
            "rating": 4.5,
            "reviews_count": 150,
            "established": "2015",
            "specialization": "Organic farming",
            "products": [
                {
                    "id": 1,
                    "name": "Organic Tomato Seeds",
                    "price": 250,
                    "unit": "per packet",
                    "stock": "Available"
                },
                {
                    "id": 2,
                    "name": "Neem Oil Pesticide",
                    "price": 180,
                    "unit": "per liter",
                    "stock": "Available"
                }
            ],
            "contact": {
                "phone": "+91 98765 43210",
                "email": "info@greenvalley.com",
                "whatsapp": "+91 98765 43210"
            }
        }
        return dealer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
async def list_products(category: str = "all"):
    """List products from dealers"""
    try:
        products = [
            {
                "id": 1,
                "name": "Organic Tomato Seeds",
                "category": "Seeds",
                "price": 250,
                "dealer": "Green Valley Seeds",
                "rating": 4.5,
                "description": "High-yield organic tomato seeds"
            },
            {
                "id": 2,
                "name": "Drip Irrigation Kit",
                "category": "Irrigation",
                "price": 2500,
                "dealer": "FarmTech Solutions",
                "rating": 4.2,
                "description": "Complete drip irrigation system"
            }
        ]
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products")
async def create_product_listing(product_data: dict):
    """Create a new product listing"""
    try:
        # Mock product creation
        new_product = {
            "id": 3,
            "name": product_data.get("name", "New Product"),
            "category": product_data.get("category", "General"),
            "price": product_data.get("price", 0),
            "dealer": "Your Store",
            "status": "Pending Approval"
        }
        return {"message": "Product listing created successfully", "product": new_product}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deals/request")
async def create_deal_request(deal_request: DealRequest):
    """Create a deal request with a dealer"""
    try:
        deal = {
            "id": 1,
            "dealer_id": deal_request.dealer_id,
            "product_id": deal_request.product_id,
            "quantity": deal_request.quantity,
            "message": deal_request.message,
            "status": "Pending",
            "created_at": "2024-01-15T10:30:00Z"
        }
        return {"message": "Deal request created successfully", "deal": deal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
