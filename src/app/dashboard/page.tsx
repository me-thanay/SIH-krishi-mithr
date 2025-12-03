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
  CheckCircle,
  Thermometer,
  Wind,
  Droplet,
  Cloud,
  Sun,
  Moon,
  Activity,
  Zap,
  Eye,
  Gauge
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
  air_quality_status?: string
  timestamp?: string
  device_id?: string
  location?: string
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [subsidies, setSubsidies] = useState<SubsidyData[]>([])
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const user = localStorage.getItem('user')
    if (user) {
      const parsedUser = JSON.parse(user)
      setUserData(parsedUser)
      
      // Fetch personalized data based on user profile
      fetchPersonalizedData(parsedUser)
      // Fetch latest sensor readings from MongoDB (MQTT data)
      fetchLatestSensorData()
    } else {
      // Redirect to login if no user data
      window.location.href = '/auth/login'
    }
  }, [])

  const fetchLatestSensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data/latest')
      if (!response.ok) return

      const body = await response.json()
      if (body?.data) {
        setSensorData(body.data)
      }
    } catch (error) {
      console.error('Error fetching latest sensor data:', error)
    }
  }

  // Auto-refresh sensor data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestSensorData()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
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

  const getSensorRecommendations = (sensor: SensorData) => {
    const recommendations = []

    // Soil Moisture Recommendations
    if (sensor.soil_moisture !== null && sensor.soil_moisture !== undefined) {
      if (sensor.soil_moisture < 30) {
        recommendations.push({
          type: "warning",
          icon: AlertTriangle,
          title: "⚠️ Low Soil Moisture Detected",
          message: `Your soil moisture is ${sensor.soil_moisture}%, which is below the ideal range (40-70%).`,
          action: "Action: Start irrigation immediately to prevent crop stress."
        })
      } else if (sensor.soil_moisture > 70) {
        recommendations.push({
          type: "info",
          icon: AlertTriangle,
          title: "High Soil Moisture",
          message: `Soil moisture is ${sensor.soil_moisture}%, which is above optimal.`,
          action: "Action: Reduce irrigation and check drainage to prevent waterlogging."
        })
      } else {
        recommendations.push({
          type: "success",
          icon: CheckCircle,
          title: "✅ Optimal Soil Moisture",
          message: `Soil moisture is ${sensor.soil_moisture}%, which is perfect for most crops.`,
          action: "Maintain current irrigation schedule."
        })
      }
    }

    // Temperature Recommendations
    if (sensor.temperature !== null && sensor.temperature !== undefined) {
      if (sensor.temperature > 35) {
        recommendations.push({
          type: "warning",
          icon: AlertTriangle,
          title: "🌡️ High Temperature Alert",
          message: `Temperature is ${sensor.temperature}°C, which is very high for most crops.`,
          action: "Action: Increase irrigation frequency, provide shade if possible, and monitor for heat stress."
        })
      } else if (sensor.temperature < 15) {
        recommendations.push({
          type: "info",
          icon: AlertTriangle,
          title: "❄️ Low Temperature",
          message: `Temperature is ${sensor.temperature}°C, which may slow crop growth.`,
          action: "Action: Consider using protective covers or greenhouses for sensitive crops."
        })
      }
    }

    // Humidity Recommendations
    if (sensor.humidity !== null && sensor.humidity !== undefined) {
      if (sensor.humidity < 40) {
        recommendations.push({
          type: "warning",
          icon: AlertTriangle,
          title: "💨 Low Humidity",
          message: `Humidity is ${sensor.humidity}%, which is quite dry.`,
          action: "Action: Increase irrigation and consider mulching to retain soil moisture."
        })
      } else if (sensor.humidity > 80) {
        recommendations.push({
          type: "info",
          icon: AlertTriangle,
          title: "🌫️ High Humidity",
          message: `Humidity is ${sensor.humidity}%, which increases disease risk.`,
          action: "Action: Ensure good air circulation and monitor for fungal diseases."
        })
      }
    }

    // Air Quality Recommendations
    if (sensor.air_quality_status === 'poor') {
      recommendations.push({
        type: "warning",
        icon: AlertTriangle,
        title: "⚠️ Poor Air Quality Detected",
        message: "Air quality indicators show elevated levels of pollutants (CO₂, NH₃, Benzene, or Smoke).",
        action: "Action: Check for nearby pollution sources, ensure proper ventilation, and consider air quality improvement measures."
      })
    } else if (sensor.air_quality_status === 'good') {
      recommendations.push({
        type: "success",
        icon: CheckCircle,
        title: "✅ Good Air Quality",
        message: "All air quality parameters are within safe limits for farming operations.",
        action: "Continue monitoring regularly."
      })
    }

    // Water Quality Recommendations
    if (sensor.water_quality) {
      if (sensor.water_quality.includes('High TDS') || sensor.water_quality.includes('Fertilizer')) {
        recommendations.push({
          type: "info",
          icon: AlertTriangle,
          title: "💧 Water Quality Notice",
          message: `Water quality: ${sensor.water_quality}. TDS: ${sensor.TDS} ppm.`,
          action: "Action: This water may be suitable for irrigation but test before using for drinking."
        })
      } else if (sensor.water_quality.includes('Safe') || sensor.water_quality.includes('Tap')) {
        recommendations.push({
          type: "success",
          icon: CheckCircle,
          title: "✅ Good Water Quality",
          message: `Water quality is ${sensor.water_quality}, suitable for irrigation.`,
          action: "Continue using this water source."
        })
      }
    }

    // Rain Status Recommendations
    if (sensor.rain_status === '1' || sensor.rain_status === 'true') {
      recommendations.push({
        type: "info",
        icon: CloudRain,
        title: "🌧️ Rain Detected",
        message: "Rain is currently detected in your field.",
        action: "Action: Reduce or pause irrigation to avoid overwatering. Monitor soil moisture levels."
      })
    }

    // Light Status Recommendations
    if (sensor.light_status) {
      if (sensor.light_status.includes('Sun Rise')) {
        recommendations.push({
          type: "success",
          icon: Sun,
          title: "☀️ Sunrise Detected",
          message: "Good morning! It's sunrise - perfect time for morning farming activities.",
          action: "Ideal time for planting, weeding, and other field activities."
        })
      } else if (sensor.light_status.includes('Sun Set')) {
        recommendations.push({
          type: "info",
          icon: Moon,
          title: "🌙 Sunset Detected",
          message: "Evening time - prepare for night irrigation or rest period.",
          action: "Consider scheduling irrigation for optimal water absorption."
        })
      }
    }

    // Motion Detection
    if (sensor.motion_detected) {
      recommendations.push({
        type: "info",
        icon: Eye,
        title: "👁️ Motion Detected in Field",
        message: "Movement detected in your field area.",
        action: "Check your field for animals, visitors, or any unusual activity."
      })
    }

    // Motor Status
    if (sensor.motor_on) {
      recommendations.push({
        type: "info",
        icon: Zap,
        title: "⚡ Irrigation Motor Running",
        message: "Your irrigation motor is currently ON.",
        action: "Monitor soil moisture levels and turn off when optimal moisture is reached."
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

          {/* Comprehensive Sensor Data from MQTT/MongoDB */}
          {sensorData ? (
            <>
              {/* Quick Summary Card */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border border-green-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Field Status Summary
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {sensorData.timestamp
                        ? `Last Update: ${new Date(sensorData.timestamp).toLocaleTimeString()}`
                        : 'Live Monitoring'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {sensorData.soil_moisture !== null && sensorData.soil_moisture !== undefined
                        ? sensorData.soil_moisture >= 30 && sensorData.soil_moisture <= 70
                          ? '✅'
                          : '⚠️'
                        : '--'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Soil Health</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {sensorData.air_quality_status === 'good' ? '✅' : sensorData.air_quality_status === 'poor' ? '⚠️' : '--'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Air Quality</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {sensorData.water_quality && (sensorData.water_quality.includes('Safe') || sensorData.water_quality.includes('Tap'))
                        ? '✅'
                        : sensorData.water_quality ? '⚠️' : '--'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Water Quality</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {sensorData.motor_on ? '⚡' : '💤'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Irrigation</p>
                  </div>
                </div>
              </div>

              {/* Main Sensor Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Gauge className="w-5 h-5 mr-2 text-green-600" />
                    Detailed Sensor Readings
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">
                      {sensorData.timestamp
                        ? `Updated: ${new Date(sensorData.timestamp).toLocaleTimeString()}`
                        : 'Live'}
                    </span>
                  </div>
                </div>

                {/* Environmental Conditions */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Environmental Conditions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <Thermometer className="w-4 h-4 text-blue-600" />
                        <span className={`text-xs px-2 py-1 rounded ${
                          sensorData.temperature && sensorData.temperature > 35 
                            ? 'bg-red-100 text-red-800' 
                            : sensorData.temperature && sensorData.temperature < 15
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sensorData.temperature && sensorData.temperature > 35 
                            ? 'Hot' 
                            : sensorData.temperature && sensorData.temperature < 15
                            ? 'Cold'
                            : 'Normal'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {sensorData.temperature ?? '--'}°C
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Temperature</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <Droplets className="w-4 h-4 text-green-600" />
                        <span className={`text-xs px-2 py-1 rounded ${
                          sensorData.humidity && sensorData.humidity < 40 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : sensorData.humidity && sensorData.humidity > 80
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sensorData.humidity && sensorData.humidity < 40 
                            ? 'Dry' 
                            : sensorData.humidity && sensorData.humidity > 80
                            ? 'Humid'
                            : 'Ideal'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {sensorData.humidity ?? '--'}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Humidity</p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <Droplet className="w-4 h-4 text-orange-600" />
                        <span className={`text-xs px-2 py-1 rounded ${
                          sensorData.soil_moisture && sensorData.soil_moisture < 30 
                            ? 'bg-red-100 text-red-800' 
                            : sensorData.soil_moisture && sensorData.soil_moisture > 70
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sensorData.soil_moisture && sensorData.soil_moisture < 30 
                            ? 'Dry' 
                            : sensorData.soil_moisture && sensorData.soil_moisture > 70
                            ? 'Wet'
                            : 'Good'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {sensorData.soil_moisture ?? '--'}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Soil Moisture</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <CloudRain className="w-4 h-4 text-purple-600" />
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                          {sensorData.rain_status === '1' || sensorData.rain_status === 'true' ? 'Rain' : 'No Rain'}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {sensorData.rain_status === '1' || sensorData.rain_status === 'true' 
                          ? '🌧️ Raining' 
                          : sensorData.rain_status === '0' || sensorData.rain_status === 'false'
                          ? '☀️ Clear'
                          : '--'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Rain Status</p>
                    </div>
                  </div>
                </div>

                {/* Air Quality Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Air Quality Analysis</h3>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Wind className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-gray-900">Overall Air Quality</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        sensorData.air_quality_status === 'poor'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-green-100 text-green-800 border border-green-300'
                      }`}>
                        {sensorData.air_quality_status === 'poor' ? '⚠️ Poor' : '✅ Good'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">CO₂</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {sensorData.CO2_ppm ?? '--'} ppm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">NH₃</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {sensorData.NH3_ppm ?? '--'} ppm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Benzene</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {sensorData.Benzene_ppm ?? '--'} ppm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Smoke</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {sensorData.Smoke_ppm ?? '--'} ppm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Water Quality & Other Sensors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Droplet className="w-4 h-4 text-cyan-600 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">Water Quality</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {sensorData.water_quality ?? '--'}
                    </p>
                    <p className="text-xs text-gray-600">TDS: {sensorData.TDS ?? '--'} ppm</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {sensorData.light === 0 ? (
                          <Sun className="w-4 h-4 text-yellow-600 mr-2" />
                        ) : (
                          <Moon className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm font-semibold text-gray-900">Light Status</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {sensorData.light_status ?? '--'}
                    </p>
                    <p className="text-xs text-gray-600">Sensor: {sensorData.light ?? '--'}</p>
                  </div>
                </div>

                {/* Motion & Motor Status */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-indigo-600 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">Motion Detection</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sensorData.motion_detected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sensorData.motion_detected ? 'Detected' : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">Motor Status</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sensorData.motor_on
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sensorData.motor_on ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Farmer-Friendly Analysis & Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-green-600" />
                  Smart Farming Recommendations
                </h2>
                <div className="space-y-3">
                  {getSensorRecommendations(sensorData).map((rec, index) => {
                    const Icon = rec.icon
                    return (
                      <div key={index} className={`flex items-start p-4 rounded-lg border ${
                        rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        rec.type === 'success' ? 'bg-green-50 border-green-200' :
                        rec.type === 'info' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <Icon className={`w-5 h-5 mt-0.5 mr-3 ${
                          rec.type === 'warning' ? 'text-yellow-600' :
                          rec.type === 'success' ? 'text-green-600' :
                          rec.type === 'info' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                          <p className="text-sm text-gray-700">{rec.message}</p>
                          {rec.action && (
                            <p className="text-xs text-gray-600 mt-2 font-medium">💡 {rec.action}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            /* No Sensor Data Available */
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Waiting for Sensor Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  No sensor data available yet. Make sure:
                </p>
                <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>MQTT service is running and connected</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>ESP32 is publishing data to MQTT broker</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Data is being saved to MongoDB Atlas</span>
                  </li>
                </ul>
                <div className="mt-4">
                  <button
                    onClick={() => fetchLatestSensorData()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Refresh Data
                  </button>
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
