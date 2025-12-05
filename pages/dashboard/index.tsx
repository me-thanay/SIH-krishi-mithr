"use client"

import React, { useState, useEffect } from "react"
import { NewNavbar } from "../../src/components/ui/new-navbar"
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
  CheckCircle,
  Activity,
  Gauge,
  Zap,
  Wind,
  Droplet,
  Power,
  Settings
} from "lucide-react"

interface UserData {
  name: string
  email: string
  phone: string
  agriculturalProfile: {
    farmSize: string
    crops: string[] | string // Can be array or JSON string
    location: string
    soilType: string
    irrigationType: string
    farmingExperience: string
    annualIncome: string
    governmentSchemes: string[] | string // Can be array or JSON string
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

interface SensorData {
  temperature?: number | null
  humidity?: number | null
  soil_moisture?: number | null
  rain_status?: string | null
  CO2_ppm?: number | null
  NH3_ppm?: number | null
  Benzene_ppm?: number | null
  Smoke_ppm?: number | null
  TDS?: number | null
  water_quality?: string | null
  light?: number | null
  light_status?: string | null
  motion?: string | null
  motion_detected?: boolean | null
  motor_state?: string | null
  motor_on?: boolean | null
  hv_state?: string | null
  hv_on?: boolean | null
  hv_auto_state?: string | null
  hv_auto_on?: boolean | null
  air_quality_status?: string | null
  timestamp?: string
  device_id?: string
  location?: string
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [subsidies, setSubsidies] = useState<SubsidyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [historyData, setHistoryData] = useState<SensorData[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  useEffect(() => {
    // Get user data from localStorage and verify with database
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      const parsedUser = JSON.parse(user)
      setUserData(parsedUser)
      
      // Fetch fresh user data from database
      fetchUserProfile()
      
      // Fetch personalized data based on user profile
      fetchPersonalizedData(parsedUser)

      // Fetch sensor data from MongoDB (latest + history)
      fetchLatestSensorData()
      fetchHistorySensorData()
    } else {
      // Redirect to login if no user data
      window.location.href = '/auth/login'
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUserData(data.user)
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      } else {
        // Token invalid, redirect to login
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // On error, redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
  }

  const fetchLatestSensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data/latest')
      if (!response.ok) {
        setConnectionStatus('disconnected')
        return
      }

      const body = await response.json()
      if (body?.data) {
        setSensorData(body.data)
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error fetching latest sensor data:', error)
      setConnectionStatus('disconnected')
    }
  }

  const fetchHistorySensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data/history?hours=48&limit=5')
      if (!response.ok) return

      const body = await response.json()
      if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
        setHistoryData(body.data)
        // If we don't have a live reading, use the newest history reading
        if (!sensorData) {
          setSensorData(body.data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching sensor history:', error)
    }
  }

  const fetchPersonalizedData = async (user: UserData) => {
    setIsLoading(true)
    
    try {
      // Parse agricultural profile data
      const profile = {
        ...user.agriculturalProfile,
        crops: Array.isArray(user.agriculturalProfile.crops) 
          ? user.agriculturalProfile.crops 
          : JSON.parse(user.agriculturalProfile.crops || '[]'),
        governmentSchemes: Array.isArray(user.agriculturalProfile.governmentSchemes)
          ? user.agriculturalProfile.governmentSchemes
          : JSON.parse(user.agriculturalProfile.governmentSchemes || '[]')
      }

      // Generate personalized subsidies (this always works)
      const personalizedSubsidies = generateSubsidies(profile)
      setSubsidies(personalizedSubsidies)

      // Try to fetch weather data (optional)
      try {
        const weatherResponse = await fetch(`/api/weather?city=${encodeURIComponent(user.agriculturalProfile.location)}&type=current`)
        if (weatherResponse.ok) {
          const weather = await weatherResponse.json()
          if (weather.success && weather.data?.current) {
            setWeatherData(weather.data.current)
          }
        }
      } catch (weatherError) {
        console.log('Weather API not available, using mock data')
        // Set mock weather data
        setWeatherData({
          temperature: 28,
          humidity: 65,
          condition: 'Partly Cloudy',
          farming_conditions: {
            irrigation_needed: false,
            good_growing: true,
            planting_suitable: true
          }
        })
      }

      // Try to fetch market prices (optional)
      try {
        const marketPromises = (profile.crops as string[]).map((crop: string) =>
          fetch(`/api/market-prices?crop=${encodeURIComponent(crop)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => data?.success ? data.data : null)
            .catch(() => null)
        )
        
        const marketResults = await Promise.all(marketPromises)
        const validResults = marketResults.filter(Boolean)
        
        if (validResults.length > 0) {
          setMarketData(validResults)
        } else {
          // Set mock market data
          const mockMarketData = (profile.crops as string[]).map((crop: string) => ({
            crop,
            min_price: 1500 + Math.floor(Math.random() * 1000),
            max_price: 2500 + Math.floor(Math.random() * 1000),
            trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
            recommendation: `Good time to ${['sell', 'hold', 'buy'][Math.floor(Math.random() * 3)]} ${crop}`
          }))
          setMarketData(mockMarketData)
        }
      } catch (marketError) {
        console.log('Market API not available, using mock data')
        // Set mock market data
        const mockMarketData = (profile.crops as string[]).map((crop: string) => ({
          crop,
          min_price: 1500 + Math.floor(Math.random() * 1000),
          max_price: 2500 + Math.floor(Math.random() * 1000),
          trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
          recommendation: `Good time to ${['sell', 'hold', 'buy'][Math.floor(Math.random() * 3)]} ${crop}`
        }))
        setMarketData(mockMarketData)
      }

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
        description: "Crop insurance for your crops: " + (
          Array.isArray(profile.crops)
            ? profile.crops.join(', ')
            : String(profile.crops)
        )
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
    if (!userData) return []

    const recommendations = []
    
    // Parse crops for recommendations
    const crops: string[] = Array.isArray(userData.agriculturalProfile.crops) 
      ? (userData.agriculturalProfile.crops as string[])
      : (JSON.parse(userData.agriculturalProfile.crops || '[]') as string[])

    // Weather-based recommendations
    if (weatherData) {
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
      crops.forEach((crop: string) => {
        if (crop === "Rice" && weatherData.temperature > 30) {
          recommendations.push({
            type: "warning",
            icon: AlertTriangle,
            title: "Rice Heat Stress",
            message: "High temperature may affect rice flowering. Ensure adequate water."
          })
        }
      })
    }

    // Soil recommendations
    if (userData.agriculturalProfile.soilType === "Clay") {
      recommendations.push({
        type: "info",
        icon: Leaf,
        title: "Clay Soil Management",
        message: "Clay soil retains water well. Avoid over-irrigation and ensure good drainage."
      })
    }

    // General farming recommendations
    if (crops.length > 0) {
      recommendations.push({
        type: "info",
        icon: Sprout,
        title: "Crop Rotation Advice",
        message: `Consider rotating your ${crops.join(', ')} crops to maintain soil health.`
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
      <NewNavbar />
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
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('user')
                  window.location.href = '/auth/login'
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
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

            {/* Sensor Data from MQTT/MongoDB */}
            {sensorData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Field Status (IoT Sensors)
                  </h2>
                  <span className="text-xs text-gray-500">
                    {sensorData.timestamp
                      ? `Last update: ${new Date(sensorData.timestamp).toLocaleString()}`
                      : 'Last saved reading from MongoDB'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Temperature</span>
                      <Gauge className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {sensorData.temperature ?? '--'}°C
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Humidity</span>
                      <Droplets className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {sensorData.humidity ?? '--'}%
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Soil Moisture</span>
                      <Droplet className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {sensorData.soil_moisture ?? '--'}%
                    </p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Rain Status</span>
                      <CloudRain className="w-4 h-4 text-cyan-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {sensorData.rain_status === '1' || sensorData.rain_status === 'true' 
                        ? '🌧️ Raining' 
                        : sensorData.rain_status === '0' || sensorData.rain_status === 'false'
                        ? '☀️ Clear'
                        : '--'}
                    </p>
                  </div>
                </div>

                {/* Air Quality & Water Quality Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Air Quality</span>
                      <Wind className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        {sensorData.air_quality_status === 'poor' ? '⚠️ Poor' : 
                         sensorData.air_quality_status === 'good' ? '✅ Good' : '--'}
                      </p>
                      {sensorData.CO2_ppm !== null && sensorData.CO2_ppm !== undefined && (
                        <span className="text-xs text-gray-600">
                          CO₂: {sensorData.CO2_ppm.toFixed(3)} ppm
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Water Quality</span>
                      <Droplet className="w-4 h-4 text-teal-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        {sensorData.water_quality ?? (sensorData.TDS !== null && sensorData.TDS !== undefined ? `TDS: ${sensorData.TDS} ppm` : '--')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Relay Controls Status */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Power className="w-4 h-4 mr-2 text-gray-600" />
                    Relay Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`rounded-lg p-3 border-2 ${
                      sensorData.motor_on 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Zap className={`w-4 h-4 mr-2 ${
                            sensorData.motor_on ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className="text-sm font-semibold text-gray-700">Motor</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sensorData.motor_on 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {sensorData.motor_on ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 border-2 ${
                      sensorData.hv_on 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Zap className={`w-4 h-4 mr-2 ${
                            sensorData.hv_on ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className="text-sm font-semibold text-gray-700">HV Generator</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sensorData.hv_on 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {sensorData.hv_on ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 border-2 ${
                      sensorData.hv_auto_on 
                        ? 'bg-purple-50 border-purple-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Settings className={`w-4 h-4 mr-2 ${
                            sensorData.hv_auto_on ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                          <span className="text-sm font-semibold text-gray-700">HV Auto</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sensorData.hv_auto_on 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {sensorData.hv_auto_on ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {connectionStatus === "disconnected" && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                    Device is currently offline. Showing the last reading saved in MongoDB.
                  </p>
                )}
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
                  {(
                    (Array.isArray(userData.agriculturalProfile.crops) 
                      ? (userData.agriculturalProfile.crops as string[])
                      : (JSON.parse(userData.agriculturalProfile.crops || '[]') as string[])
                    )
                  ).map((crop: string) => (
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
