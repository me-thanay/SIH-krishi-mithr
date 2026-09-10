import React, { useState } from 'react'
import { MarketPrices } from '@/components/ui/market-prices'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown
} from 'lucide-react'

export default function VegetablesDemo() {
  const [selectedLocation, setSelectedLocation] = useState("Punjab")

  const locations = [
    { name: "Punjab", flag: "🌾" },
    { name: "Haryana", flag: "🌱" },
    { name: "Uttar Pradesh", flag: "🌿" },
    { name: "Maharashtra", flag: "🌴" },
    { name: "Karnataka", flag: "🌳" }
  ]

  const categories = [
    { name: "Grains & Cereals", icon: "🌾", count: 4, color: "text-amber-600" },
    { name: "Vegetables", icon: "🥕", count: 20, color: "text-green-600" },
    { name: "Spices & Herbs", icon: "🌶️", count: 5, color: "text-red-600" },
    { name: "Others", icon: "🌿", count: 8, color: "text-blue-600" }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🥬 Comprehensive Agricultural Market Data
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore real-time prices for 37+ agricultural commodities including vegetables, 
            grains, spices, and more from Punjab and other major agricultural states.
          </p>
        </div>

        {/* Location Selector */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Location</h2>
            <div className="flex flex-wrap gap-3">
              {locations.map((location) => (
                <Button
                  key={location.name}
                  onClick={() => setSelectedLocation(location.name)}
                  variant={selectedLocation === location.name ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    selectedLocation === location.name 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "border-green-600 text-green-600 hover:bg-green-50"
                  }`}
                >
                  <span className="text-lg">{location.flag}</span>
                  {location.name}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Categories Overview */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Commodity Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category.name} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.count} commodities</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Market Intelligence Dashboard */}
        <div className="mb-8">
          <MarketPrices 
            location={selectedLocation} 
            autoDetectLocation={false}
            className="w-full"
          />
        </div>

        {/* Featured Commodities */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Commodities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🍅</div>
                <h3 className="font-semibold text-gray-900">Tomato</h3>
                <p className="text-sm text-gray-600">₹1,400/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+8.5%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl mb-2">🧅</div>
                <h3 className="font-semibold text-gray-900">Onion</h3>
                <p className="text-sm text-gray-600">₹1,800/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">-1.2%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl mb-2">🥔</div>
                <h3 className="font-semibold text-gray-900">Potato</h3>
                <p className="text-sm text-gray-600">₹1,200/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+3.5%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl mb-2">🥕</div>
                <h3 className="font-semibold text-gray-900">Carrot</h3>
                <p className="text-sm text-gray-600">₹2,800/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+4.2%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🫚</div>
                <h3 className="font-semibold text-gray-900">Ginger</h3>
                <p className="text-sm text-gray-600">₹7,200/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+12.5%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">🫛</div>
                <h3 className="font-semibold text-gray-900">Green Peas</h3>
                <p className="text-sm text-gray-600">₹11,200/quintal</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+18.5%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Data Source Info */}
        <div className="text-center">
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              📊 Data Source
            </h3>
            <p className="text-green-700">
              Market prices are sourced from Punjab vegetables price website and other agricultural 
              market data providers. Prices are updated in real-time and reflect current market conditions.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-green-600">
              <span>🌾 37+ Commodities</span>
              <span>📍 5+ Locations</span>
              <span>📈 Real-time Trends</span>
              <span>🔄 Live Updates</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
