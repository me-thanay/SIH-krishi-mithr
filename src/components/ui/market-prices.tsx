"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  MapPin,
  BarChart3,
  AlertTriangle
} from "lucide-react"
import { Card } from "./card"
import { Button } from "./button"
import { PriceTrendChart } from "./price-trend-chart"
import { cn } from "@/lib/utils"

interface PriceData {
  date: string
  price: number
}

interface MarketPrice {
  commodity: string
  price: number
  unit: string
  change: number
  status: "up" | "down" | "stable"
}

interface CommodityTrend {
  commodity: string
  data: PriceData[]
  color: string
  trend: 'up' | 'down' | 'stable'
}

interface MarketPricesProps {
  location?: string
  autoDetectLocation?: boolean
  className?: string
}

export const MarketPrices = ({ 
  location = "Punjab", 
  autoDetectLocation = false,
  className 
}: MarketPricesProps) => {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [trends, setTrends] = useState<CommodityTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState(location)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [showAllCommodities, setShowAllCommodities] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    if (autoDetectLocation) {
      detectLocation()
    } else {
      fetchMarketPrices(currentLocation)
    }
  }, [autoDetectLocation, currentLocation])

  const detectLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // Reverse geocoding to get state/city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            const data = await response.json()
            
            const detectedLocation = data.principalSubdivision || data.locality || "Punjab"
            setCurrentLocation(detectedLocation)
            fetchMarketPrices(detectedLocation)
          },
          (error) => {
            console.error('Location detection failed:', error)
            fetchMarketPrices(currentLocation)
          }
        )
      } else {
        fetchMarketPrices(currentLocation)
      }
    } catch (error) {
      console.error('Location detection error:', error)
      fetchMarketPrices(currentLocation)
    }
  }

  const fetchMarketPrices = async (location: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8000'
          : '')
      // Remove trailing slash to avoid double slashes
      apiBase = apiBase.replace(/\/+$/, '')
      // Fetch both prices and trends in parallel
      const [pricesResponse, trendsResponse] = await Promise.all([
        fetch(`${apiBase}/api/market-prices?location=${encodeURIComponent(location)}`),
        fetch(`${apiBase}/api/market-prices/trends?location=${encodeURIComponent(location)}`)
      ])
      
      if (!pricesResponse.ok) {
        throw new Error(`Failed to fetch market prices: ${pricesResponse.statusText}`)
      }
      
      if (!trendsResponse.ok) {
        throw new Error(`Failed to fetch price trends: ${trendsResponse.statusText}`)
      }
      
      const [pricesData, trendsData] = await Promise.all([
        pricesResponse.json(),
        trendsResponse.json()
      ])
      
      setPrices(pricesData.prices || [])
      setTrends(trendsData.trends || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching market data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch market data')
      
      // Fallback to mock data
      setPrices([
        {
          commodity: "Rice",
          price: 2850,
          unit: "quintal",
          change: 5.2,
          status: "up"
        },
        {
          commodity: "Wheat",
          price: 2200,
          unit: "quintal",
          change: -2.1,
          status: "down"
        },
        {
          commodity: "Corn",
          price: 1950,
          unit: "quintal",
          change: 1.8,
          status: "stable"
        }
      ])
      
      // Mock trend data
      setTrends([
        {
          commodity: "Rice",
          color: "#10B981",
          trend: "up",
          data: [
            { date: "2024-01-01", price: 2700 },
            { date: "2024-01-08", price: 2750 },
            { date: "2024-01-15", price: 2800 },
            { date: "2024-01-22", price: 2820 },
            { date: "2024-01-29", price: 2850 },
            { date: "2024-02-05", price: 2870 },
            { date: "2024-02-12", price: 2900 },
          ]
        },
        {
          commodity: "Wheat",
          color: "#EF4444",
          trend: "down",
          data: [
            { date: "2024-01-01", price: 2300 },
            { date: "2024-01-08", price: 2280 },
            { date: "2024-01-15", price: 2250 },
            { date: "2024-01-22", price: 2230 },
            { date: "2024-01-29", price: 2200 },
            { date: "2024-02-05", price: 2180 },
            { date: "2024-02-12", price: 2150 },
          ]
        },
        {
          commodity: "Corn",
          color: "#F59E0B",
          trend: "stable",
          data: [
            { date: "2024-01-01", price: 1900 },
            { date: "2024-01-08", price: 1920 },
            { date: "2024-01-15", price: 1940 },
            { date: "2024-01-22", price: 1930 },
            { date: "2024-01-29", price: 1950 },
            { date: "2024-02-05", price: 1960 },
            { date: "2024-02-12", price: 1970 },
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchMarketPrices(currentLocation)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getCommodityCategory = (commodity: string) => {
    const grains = ["Rice", "Wheat", "Corn", "Barley"]
    const vegetables = ["Potato", "Onion", "Tomato", "Carrot", "Cauliflower", "Cabbage", "Brinjal (Eggplant)", "Ladies Fingers (Okra)", "Capsicum", "Green Chilli", "Cucumber", "Bottle Gourd", "Pumpkin", "Radish", "Beetroot", "Sweet Potato", "Drumstick", "Chow Chow (Chayote)", "Knol Khol (Kohlrabi)"]
    const spices = ["Ginger", "Garlic", "Coriander Leaves", "Methi (Fenugreek Leaves)", "Curry Leaves"]
    const others = ["Green Peas", "Sweet Corn", "Coconut", "Groundnut", "Mushrooms - Button", "Broccoli", "Lettuce", "Spring Onion"]
    
    if (grains.includes(commodity)) return "grains"
    if (vegetables.includes(commodity)) return "vegetables"
    if (spices.includes(commodity)) return "spices"
    if (others.includes(commodity)) return "others"
    return "others"
  }

  const filteredPrices = prices.filter(price => {
    if (selectedCategory === "all") return true
    return getCommodityCategory(price.commodity) === selectedCategory
  })

  const displayedPrices = showAllCommodities ? filteredPrices : filteredPrices.slice(0, 6)

  if (loading && prices.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
            <p className="text-gray-600">Loading market prices...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Market Intelligence</h3>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Prices */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-700">Current Prices</h4>
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="grains">Grains & Cereals</option>
                <option value="vegetables">Vegetables</option>
                <option value="spices">Spices & Herbs</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {displayedPrices.map((price, index) => (
              <motion.div
                key={price.commodity}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{price.commodity}</h5>
                    <p className="text-sm text-gray-600">₹{price.price}/{price.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(price.status)}
                      <span className={cn("text-sm font-medium", getStatusColor(price.status))}>
                        {price.change > 0 ? '+' : ''}{price.change}%
                      </span>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      price.status === "up" ? "bg-green-100 text-green-800" :
                      price.status === "down" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {price.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Show More/Less Button */}
          {filteredPrices.length > 6 && (
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowAllCommodities(!showAllCommodities)}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {showAllCommodities ? 'Show Less' : `Show All (${filteredPrices.length})`}
              </Button>
            </div>
          )}
        </div>

        {/* Price Trends */}
        <div>
          <PriceTrendChart 
            trends={trends} 
            chartType="line"
            className="h-full"
          />
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location and Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{currentLocation}</span>
          </div>
          <span>Last updated: {formatTime(lastUpdated)}</span>
        </div>
      </div>
    </Card>
  )
}
