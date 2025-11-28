"use client"

import React, { useState, useEffect } from "react"
import { 
  Sprout, 
  CloudRain, 
  TrendingUp, 
  Leaf, 
  DollarSign, 
  MapPin,
  Calendar,
  Droplets,
  Award,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface UserData {
  name: string
  email: string
  phone: string
  agriculturalProfile: {
    farmSize: string
    crops: string[]
    location: string
    soilType: string
    irrigationType: string
    farmingExperience: string
    annualIncome: string
    governmentSchemes: string[]
  }
}

interface WeatherData {
  temperature: number
  humidity: number
  condition: string
  farming_conditions: {
    irrigation_needed: boolean
    good_growing: boolean
    planting_suitable: boolean
  }
}

interface MarketData {
  crop: string
  min_price: number
  max_price: number
  trend: string
  recommendation: string
}

interface SubsidyData {
  scheme: string
  amount: string
  eligibility: boolean
  description: string
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [subsidies, setSubsidies] = useState<SubsidyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const user = localStorage.getItem('user')
    if (user) {
      const parsedUser = JSON.parse(user)
      setUserData(parsedUser)
      
      // Fetch personalized data based on user profile
      fetchPersonalizedData(parsedUser)
    } else {
      // Redirect to login if no user data
      window.location.href = '/auth/login'
    }
  }, [])

  const fetchPersonalizedData = async (user: UserData) => {
    setIsLoading(true)
    
    try {
      // Fetch weather data for user's location
      const weatherResponse = await fetch(`/api/weather?city=${encodeURIComponent(user.agriculturalProfile.location)}&type=current`)
      const weather = await weatherResponse.json()
      if (weather.success) {
        setWeatherData(weather.data.current)
      }

      // Fetch market prices for user's crops
      const marketPromises = user.agriculturalProfile.crops.map(crop =>
        fetch(`/api/agmarknet-prices?crop=${encodeURIComponent(crop)}`)
          .then(res => res.json())
          .then(data => data.success ? data.data : null)
      )
      
      const marketResults = await Promise.all(marketPromises)
      setMarketData(marketResults.filter(Boolean))

      // Generate personalized subsidies
      const personalizedSubsidies = generateSubsidies(user.agriculturalProfile)
      setSubsidies(personalizedSubsidies)

    } catch (error) {
      console.error('Error fetching personalized data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSubsidies = (profile: UserData['agriculturalProfile']): SubsidyData[] => {
    const subsidies: SubsidyData[] = []

    // PM-KISAN (₹6000/year for all farmers)
    subsidies.push({
      scheme: "PM-KISAN",
      amount: "₹6,000/year",
      eligibility: true,
      description: "Direct income support for all farmers"
    })

    // Soil Health Card
    subsidies.push({
      scheme: "Soil Health Card",
      amount: "Free",
      eligibility: true,
      description: "Free soil testing and health card"
    })

    // Crop Insurance
    if (profile.crops.length > 0) {
      subsidies.push({
        scheme: "Pradhan Mantri Fasal Bima Yojana",
        amount: "Up to ₹50,000",
        eligibility: true,
        description: "Crop insurance for your crops: " + profile.crops.join(', ')
      })
    }

    // Irrigation subsidies
    if (profile.irrigationType === "Drip Irrigation" || profile.irrigationType === "Sprinkler") {
      subsidies.push({
        scheme: "Micro Irrigation Fund",
        amount: "Up to ₹1,00,000",
        eligibility: true,
        description: "Subsidy for micro irrigation systems"
      })
    }

    // Organic farming
    if (profile.soilType === "Red Soil" || profile.soilType === "Black Soil") {
      subsidies.push({
        scheme: "Paramparagat Krishi Vikas Yojana",
        amount: "₹50,000/hectare",
        eligibility: true,
        description: "Support for organic farming practices"
      })
    }

    // Small farmer support
    if (profile.farmSize === "0-1" || profile.farmSize === "1-5") {
      subsidies.push({
        scheme: "Small Farmer Agribusiness Consortium",
        amount: "Up to ₹25,00,000",
        eligibility: true,
        description: "Support for small farmers' agribusiness ventures"
      })
    }

    return subsidies
  }

  const getFarmingRecommendations = () => {
    if (!userData || !weatherData) return []

    const recommendations = []

    // Weather-based recommendations
    if (weatherData.farming_conditions.irrigation_needed) {
      recommendations.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Irrigation Required",
        message: "Low humidity detected. Consider irrigating your fields."
      })
    }

    if (weatherData.farming_conditions.good_growing) {
      recommendations.push({
        type: "success",
        icon: CheckCircle,
        title: "Excellent Growing Conditions",
        message: "Current weather is perfect for your crops."
      })
    }

    // Crop-specific recommendations
    userData.agriculturalProfile.crops.forEach(crop => {
      if (crop === "Rice" && weatherData.temperature > 30) {
        recommendations.push({
          type: "warning",
          icon: AlertTriangle,
          title: "Rice Heat Stress",
          message: "High temperature may affect rice flowering. Ensure adequate water."
        })
      }
    })

    // Soil recommendations
    if (userData.agriculturalProfile.soilType === "Clay") {
      recommendations.push({
        type: "info",
        icon: Leaf,
        title: "Clay Soil Management",
        message: "Clay soil retains water well. Avoid over-irrigation and ensure good drainage."
      })
    }

    return recommendations
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <a href="/auth/login" className="bg-green-600 text-white px-6 py-2 rounded-lg">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  const recommendations = getFarmingRecommendations()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userData.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Your personalized agricultural dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Farm Size</p>
                <p className="font-semibold text-gray-900">{userData.agriculturalProfile.farmSize} acres</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">{userData.agriculturalProfile.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Card */}
            {weatherData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CloudRain className="w-5 h-5 mr-2 text-blue-600" />
                    Weather for {userData.agriculturalProfile.location}
                  </h2>
                  <span className="text-sm text-gray-500">Real-time</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{weatherData.temperature}°C</p>
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{weatherData.humidity}%</p>
                    <p className="text-sm text-gray-600">Humidity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{weatherData.condition}</p>
                    <p className="text-sm text-gray-600">Condition</p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Prices */}
            {marketData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Market Prices for Your Crops
                </h2>
                <div className="space-y-4">
                  {marketData.map((market, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{market.crop}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          market.trend === 'rising' ? 'bg-green-100 text-green-800' :
                          market.trend === 'falling' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {market.trend}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Min Price</p>
                          <p className="font-semibold text-gray-900">₹{market.min_price}/quintal</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Max Price</p>
                          <p className="font-semibold text-gray-900">₹{market.max_price}/quintal</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{market.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Farming Recommendations
                </h2>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => {
                    const Icon = rec.icon
                    return (
                      <div key={index} className={`flex items-start p-3 rounded-lg ${
                        rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        rec.type === 'success' ? 'bg-green-50 border border-green-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <Icon className={`w-5 h-5 mt-0.5 mr-3 ${
                          rec.type === 'warning' ? 'text-yellow-600' :
                          rec.type === 'success' ? 'text-green-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <h3 className="font-medium text-gray-900">{rec.title}</h3>
                          <p className="text-sm text-gray-600">{rec.message}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Farm Profile */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Farm Profile</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">{userData.agriculturalProfile.location}</span>
                </div>
                <div className="flex items-center">
                  <Sprout className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">{userData.agriculturalProfile.farmSize} acres</span>
                </div>
                <div className="flex items-center">
                  <Leaf className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">{userData.agriculturalProfile.soilType} soil</span>
                </div>
                <div className="flex items-center">
                  <Droplets className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">{userData.agriculturalProfile.irrigationType}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Crops:</p>
                <div className="flex flex-wrap gap-1">
                  {userData.agriculturalProfile.crops.map(crop => (
                    <span key={crop} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Subsidies */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                Available Subsidies
              </h2>
              <div className="space-y-3">
                {subsidies.map((subsidy, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{subsidy.scheme}</h3>
                      <span className="text-sm font-semibold text-green-600">{subsidy.amount}</span>
                    </div>
                    <p className="text-sm text-gray-600">{subsidy.description}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subsidy.eligibility 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subsidy.eligibility ? 'Eligible' : 'Not Eligible'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
