from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any, Optional
import base64
import json
import random
from datetime import datetime

router = APIRouter()

@router.post("/analyze")
async def analyze_soil(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    crop_type: Optional[str] = Form(None)
):
    """Analyze soil from uploaded image with comprehensive recommendations"""
    try:
        # Read image file
        contents = await file.read()
        
        # Simulate AI analysis based on image characteristics
        # In a real implementation, this would use computer vision models
        image_size = len(contents)
        
        # Generate realistic soil analysis based on image characteristics
        soil_types = ["Sandy Loam", "Clay Loam", "Silty Clay", "Sandy Clay", "Loamy Sand", "Silt Loam"]
        soil_type = random.choice(soil_types)
        
        # Generate pH based on soil type
        ph_ranges = {
            "Sandy Loam": (6.0, 7.5),
            "Clay Loam": (5.5, 7.0),
            "Silty Clay": (6.5, 8.0),
            "Sandy Clay": (5.0, 6.5),
            "Loamy Sand": (6.2, 7.8),
            "Silt Loam": (6.0, 7.2)
        }
        
        ph_min, ph_max = ph_ranges.get(soil_type, (6.0, 7.0))
        ph_level = round(random.uniform(ph_min, ph_max), 1)
        
        # Generate nutrient levels
        nutrients = {
            "nitrogen": random.choice(["Low", "Medium", "High"]),
            "phosphorus": random.choice(["Low", "Medium", "High"]),
            "potassium": random.choice(["Low", "Medium", "High"]),
            "organic_matter": random.choice(["Poor", "Fair", "Good", "Excellent"]),
            "calcium": random.choice(["Low", "Medium", "High"]),
            "magnesium": random.choice(["Low", "Medium", "High"]),
            "sulfur": random.choice(["Low", "Medium", "High"])
        }
        
        # Generate detailed recommendations
        recommendations = generate_soil_recommendations(soil_type, ph_level, nutrients, crop_type)
        
        # Generate crop suitability
        crop_suitability = generate_crop_suitability(soil_type, ph_level, nutrients)
        
        # Generate fertilizer recommendations
        fertilizer_recommendations = generate_fertilizer_recommendations(nutrients, soil_type)
        
        # Generate pest and disease prevention
        pest_prevention = generate_pest_prevention_recommendations(soil_type, nutrients)
        
        # Generate cultivation methods
        cultivation_methods = generate_cultivation_methods(soil_type, nutrients)
        
        mock_result = {
            "analysis_id": f"SOIL_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "location": location or "Unknown",
            "crop_type": crop_type or "General",
            "soil_type": soil_type,
            "ph_level": ph_level,
            "ph_status": get_ph_status(ph_level),
            "nutrients": nutrients,
            "soil_health_score": calculate_soil_health_score(nutrients, ph_level),
            "recommendations": recommendations,
            "crop_suitability": crop_suitability,
            "fertilizer_recommendations": fertilizer_recommendations,
            "pest_prevention": pest_prevention,
            "cultivation_methods": cultivation_methods,
            "irrigation_needs": get_irrigation_needs(soil_type),
            "image_processed": True,
            "confidence_score": round(random.uniform(85, 95), 1)
        }
        
        return mock_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_ph_status(ph_level: float) -> str:
    """Determine pH status"""
    if ph_level < 6.0:
        return "Acidic"
    elif ph_level > 8.0:
        return "Alkaline"
    else:
        return "Neutral"

def calculate_soil_health_score(nutrients: Dict, ph_level: float) -> int:
    """Calculate overall soil health score"""
    score = 0
    
    # pH score (0-30 points)
    if 6.0 <= ph_level <= 7.5:
        score += 30
    elif 5.5 <= ph_level <= 8.0:
        score += 20
    else:
        score += 10
    
    # Nutrient scores (0-10 points each)
    nutrient_scores = {"Low": 3, "Medium": 7, "High": 10}
    organic_scores = {"Poor": 2, "Fair": 5, "Good": 8, "Excellent": 10}
    
    for nutrient, level in nutrients.items():
        if nutrient == "organic_matter":
            score += organic_scores.get(level, 5)
        else:
            score += nutrient_scores.get(level, 5)
    
    return min(score, 100)

def generate_soil_recommendations(soil_type: str, ph_level: float, nutrients: Dict, crop_type: Optional[str]) -> List[Dict]:
    """Generate comprehensive soil recommendations"""
    recommendations = []
    
    # pH recommendations
    if ph_level < 6.0:
        recommendations.append({
            "category": "pH Management",
            "priority": "High",
            "recommendation": "Soil is acidic. Add lime to raise pH",
            "action": f"Apply 2-4 kg of agricultural lime per 100 sq m",
            "timeline": "Apply 2-4 weeks before planting"
        })
    elif ph_level > 8.0:
        recommendations.append({
            "category": "pH Management", 
            "priority": "High",
            "recommendation": "Soil is alkaline. Add sulfur to lower pH",
            "action": f"Apply 1-2 kg of elemental sulfur per 100 sq m",
            "timeline": "Apply 3-6 months before planting"
        })
    
    # Nutrient recommendations
    for nutrient, level in nutrients.items():
        if level == "Low":
            recommendations.append({
                "category": f"{nutrient.title()} Management",
                "priority": "High",
                "recommendation": f"{nutrient.title()} levels are low",
                "action": f"Apply {nutrient}-rich fertilizer or organic amendments",
                "timeline": "Apply before planting and during growth season"
            })
    
    # Soil type specific recommendations
    if "Clay" in soil_type:
        recommendations.append({
            "category": "Soil Structure",
            "priority": "Medium",
            "recommendation": "Improve drainage and aeration",
            "action": "Add organic matter and sand to improve structure",
            "timeline": "Apply annually during off-season"
        })
    elif "Sandy" in soil_type:
        recommendations.append({
            "category": "Water Retention",
            "priority": "Medium", 
            "recommendation": "Improve water retention",
            "action": "Add compost and organic matter to increase water holding capacity",
            "timeline": "Apply before each planting season"
        })
    
    return recommendations

def generate_crop_suitability(soil_type: str, ph_level: float, nutrients: Dict) -> List[Dict]:
    """Generate crop suitability recommendations"""
    crops = []
    
    # Define crop preferences
    crop_preferences = {
        "Sandy Loam": ["Carrots", "Potatoes", "Sweet Potatoes", "Radishes", "Onions"],
        "Clay Loam": ["Rice", "Wheat", "Corn", "Soybeans", "Cotton"],
        "Silty Clay": ["Rice", "Wheat", "Barley", "Oats", "Rye"],
        "Sandy Clay": ["Peanuts", "Sweet Potatoes", "Watermelons", "Cantaloupes"],
        "Loamy Sand": ["Tomatoes", "Peppers", "Eggplant", "Squash", "Cucumbers"],
        "Silt Loam": ["Lettuce", "Spinach", "Broccoli", "Cabbage", "Cauliflower"]
    }
    
    suitable_crops = crop_preferences.get(soil_type, ["Tomatoes", "Peppers", "Lettuce"])
    
    for crop in suitable_crops[:5]:  # Top 5 crops
        suitability_score = random.randint(75, 95)
        crops.append({
            "crop_name": crop,
            "suitability_score": suitability_score,
            "suitability_level": "Excellent" if suitability_score >= 90 else "Good" if suitability_score >= 80 else "Fair",
            "reason": f"Well-suited for {soil_type} soil with pH {ph_level}",
            "planting_season": random.choice(["Spring", "Summer", "Fall", "Year-round"]),
            "expected_yield": f"{random.randint(80, 120)}% of optimal"
        })
    
    return crops

def generate_fertilizer_recommendations(nutrients: Dict, soil_type: str) -> List[Dict]:
    """Generate fertilizer recommendations"""
    fertilizers = []
    
    # NPK recommendations based on nutrient levels
    if nutrients["nitrogen"] == "Low":
        fertilizers.append({
            "type": "Nitrogen Fertilizer",
            "product": "Urea (46-0-0) or Ammonium Nitrate (34-0-0)",
            "application_rate": "50-75 kg per hectare",
            "timing": "Split application: 50% at planting, 50% during growth",
            "method": "Broadcast or side-dress",
            "cost_estimate": "₹800-1200 per hectare"
        })
    
    if nutrients["phosphorus"] == "Low":
        fertilizers.append({
            "type": "Phosphorus Fertilizer", 
            "product": "DAP (18-46-0) or Superphosphate (0-20-0)",
            "application_rate": "40-60 kg per hectare",
            "timing": "Apply at planting or before planting",
            "method": "Band placement near seeds",
            "cost_estimate": "₹600-900 per hectare"
        })
    
    if nutrients["potassium"] == "Low":
        fertilizers.append({
            "type": "Potassium Fertilizer",
            "product": "Muriate of Potash (0-0-60) or Sulphate of Potash (0-0-50)",
            "application_rate": "30-50 kg per hectare", 
            "timing": "Apply at planting",
            "method": "Broadcast and incorporate",
            "cost_estimate": "₹400-700 per hectare"
        })
    
    # Organic recommendations
    if nutrients["organic_matter"] in ["Poor", "Fair"]:
        fertilizers.append({
            "type": "Organic Matter",
            "product": "Compost, Farmyard Manure, or Green Manure",
            "application_rate": "10-15 tons per hectare",
            "timing": "Apply 2-4 weeks before planting",
            "method": "Spread evenly and incorporate",
            "cost_estimate": "₹2000-4000 per hectare"
        })
    
    return fertilizers

def generate_pest_prevention_recommendations(soil_type: str, nutrients: Dict) -> List[Dict]:
    """Generate pest and disease prevention recommendations"""
    prevention = []
    
    # General soil health recommendations
    prevention.append({
        "category": "Soil Health",
        "recommendation": "Maintain balanced soil nutrients",
        "action": "Regular soil testing and balanced fertilization",
        "benefit": "Healthy plants resist pests and diseases better"
    })
    
    # pH-related pest prevention
    if nutrients.get("ph_level", 7) < 6.0:
        prevention.append({
            "category": "pH Management",
            "recommendation": "Correct acidic soil",
            "action": "Apply lime to raise pH to 6.5-7.0",
            "benefit": "Reduces fungal diseases and improves nutrient availability"
        })
    
    # Soil type specific recommendations
    if "Clay" in soil_type:
        prevention.append({
            "category": "Drainage",
            "recommendation": "Improve soil drainage",
            "action": "Add organic matter and create raised beds",
            "benefit": "Prevents root rot and fungal diseases"
        })
    
    # Organic matter recommendations
    if nutrients["organic_matter"] in ["Poor", "Fair"]:
        prevention.append({
            "category": "Organic Matter",
            "recommendation": "Increase organic matter content",
            "action": "Add compost, manure, or cover crops",
            "benefit": "Improves soil structure and beneficial microorganism activity"
        })
    
    # Crop rotation recommendations
    prevention.append({
        "category": "Crop Rotation",
        "recommendation": "Practice crop rotation",
        "action": "Rotate crops from different families every 2-3 years",
        "benefit": "Breaks pest and disease cycles naturally"
    })
    
    return prevention

def generate_cultivation_methods(soil_type: str, nutrients: Dict) -> List[Dict]:
    """Generate cultivation method recommendations"""
    methods = []
    
    # Tillage recommendations
    if "Clay" in soil_type:
        methods.append({
            "method": "Deep Tillage",
            "description": "Deep plowing to break up compacted clay layers",
            "timing": "During dry season when soil is workable",
            "depth": "15-20 cm",
            "frequency": "Once per year before planting"
        })
    else:
        methods.append({
            "method": "Shallow Tillage",
            "description": "Light cultivation to prepare seedbed",
            "timing": "1-2 weeks before planting",
            "depth": "8-12 cm", 
            "frequency": "Before each planting"
        })
    
    # Planting recommendations
    methods.append({
        "method": "Seedbed Preparation",
        "description": "Create fine, well-drained seedbed",
        "timing": "After tillage, before planting",
        "depth": "2-3 cm for most crops",
        "frequency": "Before each planting"
    })
    
    # Mulching recommendations
    if "Sandy" in soil_type:
        methods.append({
            "method": "Mulching",
            "description": "Apply organic mulch to conserve moisture",
            "timing": "After planting and emergence",
            "depth": "5-8 cm layer",
            "frequency": "Maintain throughout growing season"
        })
    
    return methods

def get_irrigation_needs(soil_type: str) -> Dict:
    """Get irrigation recommendations based on soil type"""
    irrigation_needs = {
        "Sandy Loam": {
            "frequency": "Every 2-3 days",
            "amount": "15-20 mm per application",
            "method": "Drip irrigation or frequent light watering",
            "total_seasonal": "400-600 mm"
        },
        "Clay Loam": {
            "frequency": "Every 5-7 days", 
            "amount": "25-30 mm per application",
            "method": "Flood irrigation or sprinkler",
            "total_seasonal": "300-500 mm"
        },
        "Silty Clay": {
            "frequency": "Every 4-6 days",
            "amount": "20-25 mm per application", 
            "method": "Sprinkler or flood irrigation",
            "total_seasonal": "350-550 mm"
        },
        "Sandy Clay": {
            "frequency": "Every 3-4 days",
            "amount": "18-22 mm per application",
            "method": "Drip irrigation preferred",
            "total_seasonal": "450-650 mm"
        },
        "Loamy Sand": {
            "frequency": "Every 2-3 days",
            "amount": "15-20 mm per application",
            "method": "Drip irrigation or frequent watering",
            "total_seasonal": "400-600 mm"
        },
        "Silt Loam": {
            "frequency": "Every 4-5 days",
            "amount": "20-25 mm per application",
            "method": "Sprinkler irrigation",
            "total_seasonal": "350-500 mm"
        }
    }
    
    return irrigation_needs.get(soil_type, irrigation_needs["Sandy Loam"])

@router.get("/types")
async def list_soil_types():
    """List all soil types"""
    try:
        soil_types = [
            {
                "id": 1,
                "name": "Sandy Soil",
                "description": "Well-draining, low nutrient retention",
                "suitable_crops": ["Carrots", "Radishes", "Potatoes"],
                "improvements": ["Add organic matter", "Regular fertilization"]
            },
            {
                "id": 2,
                "name": "Clay Soil",
                "description": "Poor drainage, high nutrient retention",
                "suitable_crops": ["Rice", "Wheat", "Corn"],
                "improvements": ["Add sand", "Improve drainage"]
            }
        ]
        return {"soil_types": soil_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_soil_recommendations():
    """Get general soil recommendations"""
    try:
        recommendations = [
            {
                "category": "pH Management",
                "recommendation": "Test soil pH every 2-3 years",
                "action": "Add lime for acidic soil, sulfur for alkaline soil"
            },
            {
                "category": "Nutrient Management",
                "recommendation": "Regular soil testing for nutrients",
                "action": "Apply fertilizers based on test results"
            },
            {
                "category": "Organic Matter",
                "recommendation": "Maintain 3-5% organic matter",
                "action": "Add compost, manure, or cover crops"
            }
        ]
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
