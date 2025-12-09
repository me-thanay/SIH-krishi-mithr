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
  Gauge,
  Power,
  Settings,
  ToggleLeft,
  ToggleRight,
  History
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
  air_quality_status?: string
  timestamp?: string
  device_id?: string
  location?: string
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [subsidies, setSubsidies] = useState<SubsidyData[]>([])
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [historyData, setHistoryData] = useState<SensorData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [relayLoading, setRelayLoading] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  const [dataUpdated, setDataUpdated] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [isHistoricalDisplay, setIsHistoricalDisplay] = useState(false)

  useEffect(() => {
    // Auth disabled: load data immediately
    fetchLatestSensorData(false)
  }, [])

  const fetchUserProfile = async () => {
    // Auth disabled: no-op
    return
  }

  const fetchLatestSensorData = async (isIncremental: boolean = false) => {
    try {
      // Use incremental update if we have a last update time
      const url = isIncremental && lastUpdateTime 
        ? `/api/sensor-data/latest?lastUpdate=${encodeURIComponent(lastUpdateTime)}`
        : '/api/sensor-data/latest'
      
      const response = await fetch(url)
      if (!response.ok) {
        setConnectionStatus('disconnected')
        // When offline, still try to show recent history from Mongo
        fetchHistorySensorData()
        return
      }

      const body = await response.json()
      
      // If incremental update and no changes, skip
      if (isIncremental && !body.updated) {
        setConnectionStatus('connected')
        return
      }
      
      if (body?.data) {
        setSensorData(body.data)
        setIsHistoricalDisplay(false)
        setLastUpdateTime(body.timestamp || body.data.timestamp || new Date().toISOString())
        
        // Show visual indicator for update
        if (isIncremental) {
          setDataUpdated(true)
          setTimeout(() => setDataUpdated(false), 2000)
        }
        
        setConnectionStatus('connected')
        // Refresh history so last 5 readings stay up to date
        fetchHistorySensorData()
      } else if (!isIncremental) {
        // First load, no data available
        setConnectionStatus('disconnected')
        fetchHistorySensorData()
      }
    } catch (error) {
      console.error('Error fetching latest sensor data:', error)
      setConnectionStatus('disconnected')
      // On error, still try to load last known readings from Mongo
      fetchHistorySensorData()
    }
  }

  const fetchHistorySensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data/history?hours=48&limit=5')
      if (!response.ok) return

      const body = await response.json()
      if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
        setHistoryData(body.data)

        const shouldUseHistory = !sensorData || isHistoricalDisplay
        if (shouldUseHistory) {
          const latestHistory = body.data[0]
          setSensorData(latestHistory)
          setIsHistoricalDisplay(true)
          setLastUpdateTime(latestHistory.timestamp || new Date().toISOString())
        }
      }
    } catch (error) {
      console.error('Error fetching sensor history:', error)
    }
  }

  const sendRelayCommand = async (command: string) => {
    setRelayLoading(command)
    try {
      const response = await fetch('/api/mqtt/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Command sent: ${command}`)
        // Refresh sensor data after a short delay to get updated motor state
        setTimeout(() => {
          fetchLatestSensorData()
        }, 1000)
      } else {
        console.error('Failed to send command:', data.error)
        alert(`Failed to send command: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending relay command:', error)
      alert('Failed to send command. Please check your connection.')
    } finally {
      setRelayLoading(null)
    }
  }

  // Auto-refresh sensor data with incremental updates
  useEffect(() => {
    // Initial fetch
    fetchLatestSensorData(false)
    
    // Then use incremental updates every 3 seconds for real-time feel
    const interval = setInterval(() => {
      // Use current lastUpdateTime from state
      fetchLatestSensorData(true)
    }, 3000) // Check for updates every 3 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - fetchLatestSensorData will use current state values

  // Personalized data disabled
  const fetchPersonalizedData = async (_user: UserData) => {
    setIsLoading(false)
  }

  const generateSubsidies = (_profile: UserData['agriculturalProfile']): SubsidyData[] => {
    // Return generic subsidies (not personalized)
    return [
      {
        scheme: "PM-KISAN",
        amount: "₹6,000/year",
        eligibility: true,
        description: "Direct income support for all farmers"
      },
      {
        scheme: "Soil Health Card",
        amount: "Free",
        eligibility: true,
        description: "Free soil testing and health card"
      },
      {
        scheme: "Pradhan Mantri Fasal Bima Yojana",
        amount: "Up to ₹50,000",
        eligibility: true,
        description: "Crop insurance for your crops"
      }
    ]
  }

  // Auth/data disabled: no personalized recommendations
  const getFarmingRecommendations = () => []

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

  // No auth: allow dashboard even without user data
  const displayUserData = userData || {
    name: 'Guest',
    email: '',
    phone: '',
    agriculturalProfile: {
      farmSize: '-',
      crops: [],
      location: '-',
      soilType: '-',
      irrigationType: '-',
      farmingExperience: '-',
      annualIncome: '-',
      state: '-',
      district: '-',
      landArea: '-',
      governmentSchemes: [],
    },
  }

  const recommendations: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome!
              </h1>
              <p className="text-gray-600 mt-1">
                Explore the dashboard without login or profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
          {/* Comprehensive Sensor Data from MQTT/MongoDB */}
          {sensorData ? (
          <>
              {/* Device / MQTT status banner */}
              <div
                className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
                  connectionStatus === 'connected'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                <div>
                  <span className="font-semibold">
                    {connectionStatus === 'connected'
                      ? 'Device Online'
                      : 'Device Offline – showing last known data'}
                  </span>
                  {sensorData.timestamp && (
                    <span className="ml-2 text-xs text-gray-600">
                      (Last update: {new Date(sensorData.timestamp).toLocaleString()})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-xs text-gray-600">
                    {connectionStatus === 'connected' ? 'Live MQTT' : 'MQTT not receiving data'}
                  </span>
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border p-6 mb-6 transition-all ${
                dataUpdated ? 'border-green-400 shadow-md' : 'border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Field Status Summary
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'connected' 
                        ? 'bg-green-500 animate-pulse' 
                        : connectionStatus === 'disconnected'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {sensorData.timestamp
                        ? `Last Update: ${new Date(sensorData.timestamp).toLocaleTimeString()}`
                        : 'Live Monitoring'}
                    </span>
                    {dataUpdated && (
                      <span className="text-xs text-green-600 font-bold animate-pulse">
                        ● UPDATED
                      </span>
                    )}
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
            <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
              dataUpdated ? 'border-green-300 shadow-md' : ''
            }`}>
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Gauge className="w-5 h-5 mr-2 text-green-600" />
                    Detailed Sensor Readings
                </h2>
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'connected' 
                        ? 'bg-green-500 animate-pulse' 
                        : connectionStatus === 'disconnected'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}></div>
                <span className="text-xs text-gray-500">
                  {sensorData.timestamp
                        ? `Updated: ${new Date(sensorData.timestamp).toLocaleTimeString()}`
                        : 'Live'}
                    </span>
                    {dataUpdated && (
                      <span className="text-xs text-green-600 font-bold animate-pulse">
                        ● NEW DATA
                      </span>
                    )}
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
              {/* Recent History (last 5 readings from MongoDB) */}
              {historyData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <History className="w-4 h-4 mr-2 text-gray-600" />
                    Recent Sensor Readings (Last {historyData.length})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-2 py-2 text-left text-gray-600 font-medium">Time</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-medium">Temp (°C)</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-medium">Humidity (%)</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-medium">Soil (%)</th>
                          <th className="px-2 py-2 text-left text-gray-600 font-medium">Motor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((h, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="px-2 py-1 text-gray-700">
                              {h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : '--'}
                            </td>
                            <td className="px-2 py-1 text-gray-700">
                              {h.temperature ?? '--'}
                            </td>
                            <td className="px-2 py-1 text-gray-700">
                              {h.humidity ?? '--'}
                            </td>
                            <td className="px-2 py-1 text-gray-700">
                              {h.soil_moisture ?? '--'}
                            </td>
                            <td className="px-2 py-1 text-gray-700">
                              {h.motor_on ? 'ON' : 'OFF'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {connectionStatus === 'disconnected' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Device is offline. Showing the last {historyData.length} readings stored in MongoDB.
                    </p>
                  )}
                </div>
              )}
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

            {/* Relay Controls - Enhanced UI */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Power className="w-5 h-5 mr-2 text-blue-600" />
                    Device Controls & Relays
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Control your farm equipment remotely via MQTT
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                    connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {connectionStatus === 'connected' ? 'MQTT Connected' : 
                     connectionStatus === 'disconnected' ? 'MQTT Disconnected' : 'Checking...'}
                  </span>
                </div>
              </div>

              {/* Main Relay Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Motor Control (Relay 1) */}
                <div className={`border-2 rounded-xl p-5 transition-all ${
                  sensorData?.motor_on 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-md' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        sensorData?.motor_on ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Irrigation Motor</h3>
                        <p className="text-xs text-gray-600">Relay 1 - Pump Control</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sensorData?.motor_on 
                          ? 'bg-green-500 text-white shadow-sm' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {sensorData?.motor_on ? '● ON' : '○ OFF'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendRelayCommand('motor:on')}
                      disabled={relayLoading === 'motor:on' || sensorData?.motor_on === true}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        sensorData?.motor_on === true
                          ? 'bg-green-400 text-white cursor-not-allowed opacity-50'
                          : relayLoading === 'motor:on'
                          ? 'bg-green-500 text-white cursor-wait scale-95'
                          : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'motor:on' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        '▶ Turn ON'
                      )}
                    </button>
                    <button
                      onClick={() => sendRelayCommand('motor:off')}
                      disabled={relayLoading === 'motor:off' || sensorData?.motor_on !== true}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        sensorData?.motor_on !== true
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                          : relayLoading === 'motor:off'
                          ? 'bg-red-500 text-white cursor-wait scale-95'
                          : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'motor:off' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        
                        '⏸ Turn OFF'
                      )}
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    Commands go to `/api/mqtt/control` with `{ command: "motor:on/off" }`. Status updates come from `sensorData.motor_on` / `motor_state`.
                  </div>
                </div>

                {/* HV Generator Control (Relay 2) */}
                <div className={`border-2 rounded-xl p-5 transition-all ${
                  sensorData?.motor_state === 'true' 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        sensorData?.motor_state === 'true' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">HV Generator</h3>
                        <p className="text-xs text-gray-600">Relay 2 - High Voltage</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sensorData?.motor_state === 'true' 
                          ? 'bg-blue-500 text-white shadow-sm' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {sensorData?.motor_state === 'true' ? '● ON' : '○ OFF'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendRelayCommand('hv:on')}
                      disabled={relayLoading === 'hv:on'}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        relayLoading === 'hv:on'
                          ? 'bg-blue-500 text-white cursor-wait scale-95'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'hv:on' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        '▶ Turn ON'
                      )}
                    </button>
                    <button
                      onClick={() => sendRelayCommand('hv:off')}
                      disabled={relayLoading === 'hv:off'}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        relayLoading === 'hv:off'
                          ? 'bg-red-500 text-white cursor-wait scale-95'
                          : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'hv:off' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        '⏸ Turn OFF'
                      )}
                    </button>
                  </div>
                </div>

                {/* HV Auto Mode Control */}
                <div className={`border-2 rounded-xl p-5 transition-all ${
                  sensorData?.motor_state === 'true' 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-md' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        sensorData?.motor_state === 'true' ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Auto Mode</h3>
                        <p className="text-xs text-gray-600">Motion-Triggered</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Current Mode</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sensorData?.motor_state === 'true' 
                          ? 'bg-purple-500 text-white shadow-sm' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {sensorData?.motor_state === 'true' ? '🔄 AUTO' : '👤 MANUAL'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendRelayCommand('hv_auto:on')}
                      disabled={relayLoading === 'hv_auto:on'}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        relayLoading === 'hv_auto:on'
                          ? 'bg-purple-500 text-white cursor-wait scale-95'
                          : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'hv_auto:on' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        '🔄 Enable AUTO'
                      )}
                    </button>
                    <button
                      onClick={() => sendRelayCommand('hv_auto:off')}
                      disabled={relayLoading === 'hv_auto:off'}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all transform ${
                        relayLoading === 'hv_auto:off'
                          ? 'bg-red-500 text-white cursor-wait scale-95'
                          : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-md'
                      }`}
                    >
                      {relayLoading === 'hv_auto:off' ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </span>
                      ) : (
                        '👤 Manual Mode'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className={`mt-4 p-4 rounded-lg border transition-all ${
                dataUpdated 
                  ? 'bg-green-50 border-green-300 animate-pulse' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {dataUpdated ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${
                      dataUpdated ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {dataUpdated ? (
                        <>✅ <strong>Data Updated!</strong> Latest sensor readings received.</>
                      ) : (
                        <>
                          <strong>Real-time Monitoring:</strong> Data is automatically updated every 3 seconds from MongoDB Atlas. 
                          Commands are sent via MQTT to your ESP32 device. Status updates may take a few seconds to reflect.
                        </>
                      )}
                    </p>
                    {sensorData?.timestamp && (
                      <p className="text-xs text-gray-600 mt-1">
                        Last update: {new Date(sensorData.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
            {/* Farm Profile (disabled) */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Required</h2>
              <p className="text-sm text-gray-600">
                You can use the dashboard without creating a profile or logging in.
              </p>
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
