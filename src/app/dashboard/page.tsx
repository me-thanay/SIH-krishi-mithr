"use client"

import React, { useState, useEffect } from "react"
import { 
  CloudRain, 
  AlertTriangle,
  CheckCircle,
  Sun,
  Moon,
  Zap,
  Eye,
} from "lucide-react"
import { DashboardBento } from "@/components/ui/dashboard-bento"

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
      governmentSchemes: [],
    },
  }
  const sensorRecommendations = sensorData ? getSensorRecommendations(sensorData) : []
  const subsidyList =
    subsidies.length > 0
      ? subsidies
      : generateSubsidies(displayUserData.agriculturalProfile)

  return (
    <DashboardBento
      sensorData={sensorData}
      historyData={historyData}
      marketData={marketData}
      subsidies={subsidyList}
      connectionStatus={connectionStatus}
      dataUpdated={dataUpdated}
      relayLoading={relayLoading}
      onRelayCommand={sendRelayCommand}
      recommendations={sensorRecommendations}
    />
  )
}
