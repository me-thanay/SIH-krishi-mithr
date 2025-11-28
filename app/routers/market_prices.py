from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
from bs4 import BeautifulSoup
import re
import logging

router = APIRouter()

class PriceData(BaseModel):
    date: str
    price: float

class MarketPrice(BaseModel):
    commodity: str
    price: float
    unit: str
    change: float
    status: str

class CommodityTrend(BaseModel):
    commodity: str
    data: List[PriceData]
    color: str
    trend: str

class MarketPricesResponse(BaseModel):
    location: str
    prices: List[MarketPrice]
    last_updated: str

class TrendResponse(BaseModel):
    location: str
    trends: List[CommodityTrend]
    last_updated: str

# Mock data for different locations
MOCK_DATA = {
    "Punjab": [
        # Grains & Cereals
        {"commodity": "Rice", "price": 2850, "unit": "quintal", "change": 5.2, "status": "up"},
        {"commodity": "Wheat", "price": 2200, "unit": "quintal", "change": -2.1, "status": "down"},
        {"commodity": "Corn", "price": 1950, "unit": "quintal", "change": 1.8, "status": "stable"},
        {"commodity": "Barley", "price": 1800, "unit": "quintal", "change": 2.5, "status": "up"},
        
        # Vegetables
        {"commodity": "Potato", "price": 1200, "unit": "quintal", "change": 3.5, "status": "up"},
        {"commodity": "Onion", "price": 1800, "unit": "quintal", "change": -1.2, "status": "down"},
        {"commodity": "Tomato", "price": 1400, "unit": "quintal", "change": 8.5, "status": "up"},
        {"commodity": "Carrot", "price": 2800, "unit": "quintal", "change": 4.2, "status": "up"},
        {"commodity": "Cauliflower", "price": 1200, "unit": "quintal", "change": -3.1, "status": "down"},
        {"commodity": "Cabbage", "price": 1000, "unit": "quintal", "change": 1.8, "status": "stable"},
        {"commodity": "Brinjal (Eggplant)", "price": 1200, "unit": "quintal", "change": 2.3, "status": "up"},
        {"commodity": "Ladies Fingers (Okra)", "price": 1600, "unit": "quintal", "change": 5.8, "status": "up"},
        {"commodity": "Capsicum", "price": 2400, "unit": "quintal", "change": -2.5, "status": "down"},
        {"commodity": "Green Chilli", "price": 2000, "unit": "quintal", "change": 6.2, "status": "up"},
        {"commodity": "Cucumber", "price": 1200, "unit": "quintal", "change": 1.5, "status": "stable"},
        {"commodity": "Bottle Gourd", "price": 800, "unit": "quintal", "change": -1.8, "status": "down"},
        {"commodity": "Pumpkin", "price": 800, "unit": "quintal", "change": 0.5, "status": "stable"},
        {"commodity": "Radish", "price": 1200, "unit": "quintal", "change": 2.1, "status": "up"},
        {"commodity": "Beetroot", "price": 1600, "unit": "quintal", "change": 3.8, "status": "up"},
        {"commodity": "Sweet Potato", "price": 2000, "unit": "quintal", "change": 4.5, "status": "up"},
        {"commodity": "Drumstick", "price": 3200, "unit": "quintal", "change": 7.2, "status": "up"},
        {"commodity": "Chow Chow (Chayote)", "price": 1200, "unit": "quintal", "change": 1.2, "status": "stable"},
        {"commodity": "Knol Khol (Kohlrabi)", "price": 1000, "unit": "quintal", "change": -0.8, "status": "down"},
        
        # Spices & Herbs
        {"commodity": "Ginger", "price": 7200, "unit": "quintal", "change": 12.5, "status": "up"},
        {"commodity": "Garlic", "price": 6000, "unit": "quintal", "change": 8.8, "status": "up"},
        {"commodity": "Coriander Leaves", "price": 600, "unit": "quintal", "change": 15.2, "status": "up"},
        {"commodity": "Methi (Fenugreek Leaves)", "price": 6000, "unit": "quintal", "change": 5.5, "status": "up"},
        {"commodity": "Curry Leaves", "price": 6000, "unit": "quintal", "change": 3.2, "status": "up"},
        
        # Fruits & Others
        {"commodity": "Green Peas", "price": 11200, "unit": "quintal", "change": 18.5, "status": "up"},
        {"commodity": "Sweet Corn", "price": 6000, "unit": "quintal", "change": 4.8, "status": "up"},
        {"commodity": "Coconut", "price": 6000, "unit": "quintal", "change": 2.1, "status": "up"},
        {"commodity": "Groundnut", "price": 6000, "unit": "quintal", "change": -1.5, "status": "down"},
        {"commodity": "Mushrooms - Button", "price": 6000, "unit": "quintal", "change": 6.8, "status": "up"},
        {"commodity": "Broccoli", "price": 6000, "unit": "quintal", "change": 9.2, "status": "up"},
        {"commodity": "Lettuce", "price": 6000, "unit": "quintal", "change": 7.5, "status": "up"},
        {"commodity": "Spring Onion", "price": 6000, "unit": "quintal", "change": 4.2, "status": "up"},
    ],
    "Haryana": [
        # Grains & Cereals
        {"commodity": "Rice", "price": 2750, "unit": "quintal", "change": 4.8, "status": "up"},
        {"commodity": "Wheat", "price": 2150, "unit": "quintal", "change": -1.8, "status": "down"},
        {"commodity": "Corn", "price": 1900, "unit": "quintal", "change": 2.1, "status": "stable"},
        {"commodity": "Barley", "price": 1750, "unit": "quintal", "change": 1.8, "status": "up"},
        
        # Vegetables
        {"commodity": "Potato", "price": 1150, "unit": "quintal", "change": 4.2, "status": "up"},
        {"commodity": "Onion", "price": 1750, "unit": "quintal", "change": -0.8, "status": "down"},
        {"commodity": "Tomato", "price": 1350, "unit": "quintal", "change": 7.2, "status": "up"},
        {"commodity": "Carrot", "price": 2700, "unit": "quintal", "change": 3.8, "status": "up"},
        {"commodity": "Cauliflower", "price": 1150, "unit": "quintal", "change": -2.5, "status": "down"},
        {"commodity": "Cabbage", "price": 950, "unit": "quintal", "change": 1.5, "status": "stable"},
        {"commodity": "Brinjal (Eggplant)", "price": 1150, "unit": "quintal", "change": 2.1, "status": "up"},
        {"commodity": "Ladies Fingers (Okra)", "price": 1550, "unit": "quintal", "change": 5.2, "status": "up"},
        {"commodity": "Capsicum", "price": 2300, "unit": "quintal", "change": -1.8, "status": "down"},
        {"commodity": "Green Chilli", "price": 1950, "unit": "quintal", "change": 5.8, "status": "up"},
        {"commodity": "Cucumber", "price": 1150, "unit": "quintal", "change": 1.2, "status": "stable"},
        {"commodity": "Bottle Gourd", "price": 750, "unit": "quintal", "change": -1.5, "status": "down"},
        {"commodity": "Pumpkin", "price": 750, "unit": "quintal", "change": 0.8, "status": "stable"},
        {"commodity": "Radish", "price": 1150, "unit": "quintal", "change": 1.8, "status": "up"},
        {"commodity": "Beetroot", "price": 1550, "unit": "quintal", "change": 3.2, "status": "up"},
        {"commodity": "Sweet Potato", "price": 1950, "unit": "quintal", "change": 4.1, "status": "up"},
        {"commodity": "Drumstick", "price": 3100, "unit": "quintal", "change": 6.8, "status": "up"},
        {"commodity": "Chow Chow (Chayote)", "price": 1150, "unit": "quintal", "change": 1.0, "status": "stable"},
        {"commodity": "Knol Khol (Kohlrabi)", "price": 950, "unit": "quintal", "change": -0.5, "status": "down"},
        
        # Spices & Herbs
        {"commodity": "Ginger", "price": 7000, "unit": "quintal", "change": 11.8, "status": "up"},
        {"commodity": "Garlic", "price": 5800, "unit": "quintal", "change": 8.2, "status": "up"},
        {"commodity": "Coriander Leaves", "price": 580, "unit": "quintal", "change": 14.5, "status": "up"},
        {"commodity": "Methi (Fenugreek Leaves)", "price": 5800, "unit": "quintal", "change": 5.1, "status": "up"},
        {"commodity": "Curry Leaves", "price": 5800, "unit": "quintal", "change": 2.8, "status": "up"},
        
        # Fruits & Others
        {"commodity": "Green Peas", "price": 10800, "unit": "quintal", "change": 17.2, "status": "up"},
        {"commodity": "Sweet Corn", "price": 5800, "unit": "quintal", "change": 4.2, "status": "up"},
        {"commodity": "Coconut", "price": 5800, "unit": "quintal", "change": 1.8, "status": "up"},
        {"commodity": "Groundnut", "price": 5800, "unit": "quintal", "change": -1.2, "status": "down"},
        {"commodity": "Mushrooms - Button", "price": 5800, "unit": "quintal", "change": 6.2, "status": "up"},
        {"commodity": "Broccoli", "price": 5800, "unit": "quintal", "change": 8.8, "status": "up"},
        {"commodity": "Lettuce", "price": 5800, "unit": "quintal", "change": 7.1, "status": "up"},
        {"commodity": "Spring Onion", "price": 5800, "unit": "quintal", "change": 3.8, "status": "up"},
    ],
    "Uttar Pradesh": [
        {"commodity": "Rice", "price": 2600, "unit": "quintal", "change": 3.2, "status": "up"},
        {"commodity": "Wheat", "price": 2100, "unit": "quintal", "change": -2.5, "status": "down"},
        {"commodity": "Corn", "price": 1850, "unit": "quintal", "change": 1.5, "status": "stable"},
        {"commodity": "Potato", "price": 1100, "unit": "quintal", "change": 5.8, "status": "up"},
        {"commodity": "Onion", "price": 1700, "unit": "quintal", "change": -1.5, "status": "down"},
    ],
    "Maharashtra": [
        {"commodity": "Rice", "price": 2700, "unit": "quintal", "change": 4.5, "status": "up"},
        {"commodity": "Wheat", "price": 2250, "unit": "quintal", "change": -1.2, "status": "down"},
        {"commodity": "Corn", "price": 2000, "unit": "quintal", "change": 2.8, "status": "stable"},
        {"commodity": "Potato", "price": 1250, "unit": "quintal", "change": 3.2, "status": "up"},
        {"commodity": "Onion", "price": 1850, "unit": "quintal", "change": -0.5, "status": "down"},
    ],
    "Karnataka": [
        {"commodity": "Rice", "price": 2800, "unit": "quintal", "change": 5.8, "status": "up"},
        {"commodity": "Wheat", "price": 2300, "unit": "quintal", "change": -0.8, "status": "down"},
        {"commodity": "Corn", "price": 2050, "unit": "quintal", "change": 3.2, "status": "stable"},
        {"commodity": "Potato", "price": 1300, "unit": "quintal", "change": 4.5, "status": "up"},
        {"commodity": "Onion", "price": 1900, "unit": "quintal", "change": -1.8, "status": "down"},
    ]
}

# Historical trend data for charts
TREND_DATA = {
    "Punjab": [
        {
            "commodity": "Rice",
            "color": "#10B981",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 2700},
                {"date": "2024-01-08", "price": 2750},
                {"date": "2024-01-15", "price": 2800},
                {"date": "2024-01-22", "price": 2820},
                {"date": "2024-01-29", "price": 2850},
                {"date": "2024-02-05", "price": 2870},
                {"date": "2024-02-12", "price": 2900},
            ]
        },
        {
            "commodity": "Wheat",
            "color": "#EF4444",
            "trend": "down",
            "data": [
                {"date": "2024-01-01", "price": 2300},
                {"date": "2024-01-08", "price": 2280},
                {"date": "2024-01-15", "price": 2250},
                {"date": "2024-01-22", "price": 2230},
                {"date": "2024-01-29", "price": 2200},
                {"date": "2024-02-05", "price": 2180},
                {"date": "2024-02-12", "price": 2150},
            ]
        },
        {
            "commodity": "Tomato",
            "color": "#DC2626",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 1200},
                {"date": "2024-01-08", "price": 1250},
                {"date": "2024-01-15", "price": 1300},
                {"date": "2024-01-22", "price": 1350},
                {"date": "2024-01-29", "price": 1400},
                {"date": "2024-02-05", "price": 1450},
                {"date": "2024-02-12", "price": 1500},
            ]
        },
        {
            "commodity": "Onion",
            "color": "#F97316",
            "trend": "down",
            "data": [
                {"date": "2024-01-01", "price": 1900},
                {"date": "2024-01-08", "price": 1880},
                {"date": "2024-01-15", "price": 1850},
                {"date": "2024-01-22", "price": 1830},
                {"date": "2024-01-29", "price": 1800},
                {"date": "2024-02-05", "price": 1780},
                {"date": "2024-02-12", "price": 1750},
            ]
        },
        {
            "commodity": "Potato",
            "color": "#84CC16",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 1100},
                {"date": "2024-01-08", "price": 1120},
                {"date": "2024-01-15", "price": 1140},
                {"date": "2024-01-22", "price": 1160},
                {"date": "2024-01-29", "price": 1200},
                {"date": "2024-02-05", "price": 1220},
                {"date": "2024-02-12", "price": 1250},
            ]
        },
        {
            "commodity": "Ginger",
            "color": "#059669",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 6500},
                {"date": "2024-01-08", "price": 6700},
                {"date": "2024-01-15", "price": 6900},
                {"date": "2024-01-22", "price": 7000},
                {"date": "2024-01-29", "price": 7200},
                {"date": "2024-02-05", "price": 7400},
                {"date": "2024-02-12", "price": 7600},
            ]
        },
        {
            "commodity": "Green Peas",
            "color": "#16A34A",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 9500},
                {"date": "2024-01-08", "price": 9800},
                {"date": "2024-01-15", "price": 10200},
                {"date": "2024-01-22", "price": 10500},
                {"date": "2024-01-29", "price": 11200},
                {"date": "2024-02-05", "price": 11500},
                {"date": "2024-02-12", "price": 11800},
            ]
        }
    ],
    "Haryana": [
        {
            "commodity": "Rice",
            "color": "#10B981",
            "trend": "up",
            "data": [
                {"date": "2024-01-01", "price": 2650},
                {"date": "2024-01-08", "price": 2700},
                {"date": "2024-01-15", "price": 2720},
                {"date": "2024-01-22", "price": 2740},
                {"date": "2024-01-29", "price": 2750},
                {"date": "2024-02-05", "price": 2770},
                {"date": "2024-02-12", "price": 2780},
            ]
        },
        {
            "commodity": "Wheat",
            "color": "#EF4444",
            "trend": "down",
            "data": [
                {"date": "2024-01-01", "price": 2200},
                {"date": "2024-01-08", "price": 2180},
                {"date": "2024-01-15", "price": 2160},
                {"date": "2024-01-22", "price": 2140},
                {"date": "2024-01-29", "price": 2150},
                {"date": "2024-02-05", "price": 2130},
                {"date": "2024-02-12", "price": 2120},
            ]
        },
        {
            "commodity": "Corn",
            "color": "#F59E0B",
            "trend": "stable",
            "data": [
                {"date": "2024-01-01", "price": 1850},
                {"date": "2024-01-08", "price": 1870},
                {"date": "2024-01-15", "price": 1890},
                {"date": "2024-01-22", "price": 1880},
                {"date": "2024-01-29", "price": 1900},
                {"date": "2024-02-05", "price": 1910},
                {"date": "2024-02-12", "price": 1920},
            ]
        }
    ]
}

async def scrape_punjab_prices() -> List[dict]:
    """Scrape prices from Punjab vegetables price website"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://market.todaypricerates.com/Punjab-vegetables-price",
                timeout=10.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from source")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for price tables or data containers
            prices = []
            
            # Try to find price data in various possible structures
            price_tables = soup.find_all(['table', 'div'], class_=re.compile(r'price|market|vegetable', re.I))
            
            for table in price_tables:
                rows = table.find_all('tr') or table.find_all('div', class_=re.compile(r'row|item', re.I))
                
                for row in rows:
                    cells = row.find_all(['td', 'th', 'div'])
                    if len(cells) >= 2:
                        try:
                            commodity_text = cells[0].get_text(strip=True)
                            price_text = cells[1].get_text(strip=True)
                            
                            # Extract price number
                            price_match = re.search(r'[\d,]+', price_text.replace(',', ''))
                            if price_match:
                                price = float(price_match.group().replace(',', ''))
                                
                                # Determine unit
                                unit = "quintal"
                                if "kg" in price_text.lower():
                                    unit = "kg"
                                elif "ton" in price_text.lower():
                                    unit = "ton"
                                
                                # Mock change percentage (in real implementation, this would be calculated)
                                change = round((price * 0.02) * (1 if hash(commodity_text) % 2 == 0 else -1), 1)
                                status = "up" if change > 0 else "down" if change < 0 else "stable"
                                
                                prices.append({
                                    "commodity": commodity_text,
                                    "price": price,
                                    "unit": unit,
                                    "change": change,
                                    "status": status
                                })
                        except (ValueError, IndexError):
                            continue
            
            # If no data found, return mock data
            if not prices:
                return MOCK_DATA["Punjab"]
            
            return prices[:10]  # Limit to 10 items
            
    except Exception as e:
        logging.error(f"Error scraping Punjab prices: {e}")
        return MOCK_DATA["Punjab"]

@router.get("/api/market-prices", response_model=MarketPricesResponse)
async def get_market_prices(
    location: str = Query(..., description="Location/State name"),
    use_real_data: bool = Query(False, description="Whether to use real scraped data")
):
    """
    Get market prices for a specific location
    """
    try:
        # Normalize location name
        location_key = location.title()
        
        # If Punjab and real data requested, try to scrape
        if location_key == "Punjab" and use_real_data:
            prices_data = await scrape_punjab_prices()
        else:
            # Use mock data for other locations or when real data not requested
            prices_data = MOCK_DATA.get(location_key, MOCK_DATA["Punjab"])
        
        # Convert to MarketPrice objects
        prices = [MarketPrice(**price) for price in prices_data]
        
        return MarketPricesResponse(
            location=location_key,
            prices=prices,
            last_updated=str(asyncio.get_event_loop().time())
        )
        
    except Exception as e:
        logging.error(f"Error fetching market prices for {location}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market prices: {str(e)}")

@router.get("/api/market-prices/trends", response_model=TrendResponse)
async def get_price_trends(
    location: str = Query(..., description="Location/State name"),
    days: int = Query(7, description="Number of days for trend data")
):
    """
    Get price trend data for charts
    """
    try:
        # Normalize location name
        location_key = location.title()
        
        # Get trend data for the location
        trends_data = TREND_DATA.get(location_key, TREND_DATA["Punjab"])
        
        # Convert to CommodityTrend objects
        trends = [CommodityTrend(**trend) for trend in trends_data]
        
        return TrendResponse(
            location=location_key,
            trends=trends,
            last_updated=str(asyncio.get_event_loop().time())
        )
        
    except Exception as e:
        logging.error(f"Error fetching price trends for {location}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price trends: {str(e)}")

@router.get("/api/market-prices/locations")
async def get_available_locations():
    """
    Get list of available locations for market prices
    """
    return {
        "locations": list(MOCK_DATA.keys()),
        "default_location": "Punjab"
    }