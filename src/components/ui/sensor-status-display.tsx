"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  Droplet, 
  Thermometer, 
  Cloud, 
  Wind, 
  Sprout, 
  Eye, 
  Sun,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  AlertOctagon
} from "lucide-react"
import { Card } from "./card"

interface SensorData {
  TDS?: number | null
  tds_ppm?: number | null
  tds?: number | null
  temperature?: number | null
  humidity?: number | null
  GasLevel?: number | null
  CO2_ppm?: number | null
  NH3_ppm?: number | null
  Benzene_ppm?: number | null
  Smoke_ppm?: number | null
  SoilMoisture?: number | null
  soil_moisture?: number | null
  soilMoisture?: number | null
  PIR?: number | null
  motion?: number | null
  motion_detected?: boolean | null
  LightLevel?: number | null
  light?: number | null
  timestamp?: string
  [key: string]: any // Allow any other fields
}

interface SensorStatus {
  status: string
  prevention: string
  severity: "good" | "warning" | "danger"
  icon: React.ReactNode
}

interface MixedCondition {
  title: string
  description: string
  prevention: string
  severity: "warning" | "danger"
}

interface SensorStatusDisplayProps {
  onConditionDetected?: (notification: {
    title: string
    message: string
    type: "success" | "warning" | "danger" | "info"
    icon?: React.ReactNode
  }) => void
}

export function SensorStatusDisplay({ onConditionDetected }: SensorStatusDisplayProps = {}) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastNotifiedConditions, setLastNotifiedConditions] = useState<Set<string>>(new Set())
  const [previousSensorData, setPreviousSensorData] = useState<SensorData | null>(null)
  const [hasInitialCheck, setHasInitialCheck] = useState(false)
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0)
  const notificationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to get numeric value (must be defined first)
  const getNumericValue = (value: any): number | null => {
    if (value === null || value === undefined) return null
    if (value === "" || value === "--" || value === "null") return null
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? null : num
  }

  // Helper to get TDS value from multiple possible field names
  const getTDSValue = (data: SensorData | null): number | null => {
    if (!data) return null
    return getNumericValue(
      data.TDS ?? 
      data.tds_ppm ?? 
      data.tds ??
      (data as any).TDS_ppm ??
      (data as any).tdsValue
    )
  }

  // Helper to check if data has significantly changed
  const hasSignificantChange = (current: SensorData, previous: SensorData | null): boolean => {
    if (!previous) return false
    
    const significantThreshold = {
      temperature: 2, // 2°C change
      humidity: 5, // 5% change
      soil_moisture: 10, // 10% change
      tds_ppm: 100, // 100 ppm change
      CO2_ppm: 50, // 50 ppm change
      light: 100, // 100 units change
    }

    const temp = getNumericValue(current.temperature)
    const prevTemp = getNumericValue(previous.temperature)
    if (temp !== null && prevTemp !== null && Math.abs(temp - prevTemp) >= significantThreshold.temperature) {
      return true
    }

    const humidity = getNumericValue(current.humidity)
    const prevHumidity = getNumericValue(previous.humidity)
    if (humidity !== null && prevHumidity !== null && Math.abs(humidity - prevHumidity) >= significantThreshold.humidity) {
      return true
    }

    const moisture = getNumericValue(current.SoilMoisture ?? current.soil_moisture)
    const prevMoisture = getNumericValue(previous.SoilMoisture ?? previous.soil_moisture)
    if (moisture !== null && prevMoisture !== null && Math.abs(moisture - prevMoisture) >= significantThreshold.soil_moisture) {
      return true
    }

    const tds = getTDSValue(current)
    const prevTds = getTDSValue(previous)
    if (tds !== null && prevTds !== null && Math.abs(tds - prevTds) >= significantThreshold.tds_ppm) {
      return true
    }

    const gas = getNumericValue(current.GasLevel ?? current.CO2_ppm)
    const prevGas = getNumericValue(previous.GasLevel ?? previous.CO2_ppm)
    if (gas !== null && prevGas !== null && Math.abs(gas - prevGas) >= significantThreshold.CO2_ppm) {
      return true
    }

    const light = getNumericValue(current.LightLevel ?? current.light)
    const prevLight = getNumericValue(previous.LightLevel ?? previous.light)
    if (light !== null && prevLight !== null && Math.abs(light - prevLight) >= significantThreshold.light) {
      return true
    }

    // Check motion status change
    const currentMotion = current.motion_detected ?? (current.PIR === 1 || current.motion === 1)
    const prevMotion = previous.motion_detected ?? (previous.PIR === 1 || previous.motion === 1)
    if (currentMotion !== prevMotion) {
      return true
    }

    return false
  }

  // Check and notify conditions (batched)
  const performConditionCheck = () => {
    if (!sensorData || !onConditionDetected) return

    // Clear previous conditions and check all current conditions
    const currentConditions = new Set<string>()
    checkAndNotifyConditions(sensorData, previousSensorData || {} as SensorData, currentConditions)
    setLastNotifiedConditions(currentConditions)
    setLastNotificationTime(Date.now())
  }

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('/api/sensor-data/latest')
        if (!response.ok) {
          throw new Error('Failed to fetch sensor data')
        }
        const result = await response.json()
        if (result.data) {
          const currentData = result.data
          // Debug: Log TDS-related fields to help diagnose
          if (process.env.NODE_ENV === 'development') {
            console.log('Sensor data received:', {
              TDS: currentData.TDS,
              tds_ppm: currentData.tds_ppm,
              tds: currentData.tds,
              allKeys: Object.keys(currentData).filter(k => k.toLowerCase().includes('tds'))
            })
          }
          
          setSensorData((prevData) => {
            // Check for significant changes
            if (prevData && hasInitialCheck) {
              const hasChange = hasSignificantChange(currentData, prevData)
              const timeSinceLastNotification = Date.now() - lastNotificationTime
              const debounceTime = 5000 // 5 seconds debounce for immediate notifications
              
              if (hasChange && timeSinceLastNotification >= debounceTime) {
                // Immediate notification for significant change (debounced)
                setTimeout(() => {
                  performConditionCheck()
                }, 100)
              }
            }
            
            return currentData
          })
          
          setError(null)
          setPreviousSensorData((prev) => prev || currentData)
        }
      } catch (err: any) {
        console.error('Error fetching sensor data:', err)
        setError(err.message || 'Failed to load sensor data')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchSensorData()
    
    // Fetch data every 10 seconds
    const dataFetchInterval = setInterval(fetchSensorData, 10000)
    
    // Perform initial condition check after first data load (wait for all sensors to be ready)
    const initialCheckTimeout = setTimeout(() => {
      if (sensorData && onConditionDetected && !hasInitialCheck) {
        performConditionCheck()
        setHasInitialCheck(true)
      }
    }, 3000) // Wait 3 seconds after first load to ensure all data is ready

    // Set up periodic condition check every 20 seconds
    notificationCheckIntervalRef.current = setInterval(() => {
      if (hasInitialCheck) {
        performConditionCheck()
      }
    }, 20000) // 20 seconds

    return () => {
      clearInterval(dataFetchInterval)
      clearTimeout(initialCheckTimeout)
      if (notificationCheckIntervalRef.current) {
        clearInterval(notificationCheckIntervalRef.current)
      }
    }
  }, [])
  
  // Separate effect to handle initial check when sensorData becomes available
  useEffect(() => {
    if (sensorData && onConditionDetected && !hasInitialCheck && !loading) {
      // Wait a bit more to ensure all sensor data is loaded
      const timeout = setTimeout(() => {
        performConditionCheck()
        setHasInitialCheck(true)
      }, 3000)
      
      return () => clearTimeout(timeout)
    }
  }, [sensorData, loading, hasInitialCheck, onConditionDetected])

  // Check for mixed conditions (must be defined before checkAndNotifyConditions)
  const getMixedConditions = (data: SensorData | null = sensorData): MixedCondition[] => {
    if (!data) return []
    
    const conditions: MixedCondition[] = []
    
    const temp = getNumericValue(data?.temperature)
    const humidity = getNumericValue(data?.humidity)
    const moisture = getNumericValue(data?.SoilMoisture ?? data?.soil_moisture)
    const light = getNumericValue(data?.LightLevel ?? data?.light)
    const tds = getTDSValue(data)
    const gasLevel = getNumericValue(data?.GasLevel ?? data?.CO2_ppm)
    const pir = data?.PIR ?? data?.motion
    const motionDetected = data?.motion_detected
    const isMotion = motionDetected === true || 
                     (typeof pir === 'number' && pir === 1) ||
                     (typeof pir === 'string' && pir === '1') ||
                     String(pir).toLowerCase() === 'true'

    // 1) High Temp + Low Moisture
    if (temp !== null && moisture !== null && temp > 35 && moisture < 20) {
      conditions.push({
        title: "High Temperature + Dry Soil",
        description: "Plants wilting fast",
        prevention: "Water early morning, mulching",
        severity: "danger"
      })
    }

    // 2) High Temp + High Humidity
    if (temp !== null && humidity !== null && temp > 35 && humidity > 70) {
      conditions.push({
        title: "High Temperature + High Humidity",
        description: "Fungal disease risk",
        prevention: "Ventilation, reduce watering",
        severity: "danger"
      })
    }

    // 3) High Humidity + Low Light
    if (humidity !== null && light !== null && humidity > 70 && light < 200) {
      conditions.push({
        title: "High Humidity + Low Light",
        description: "Leaf rot, fungal growth",
        prevention: "Airflow",
        severity: "warning"
      })
    }

    // 4) High Sunlight + Low Moisture
    if (light !== null && moisture !== null && light > 900 && moisture < 20) {
      conditions.push({
        title: "Very High Sunlight + Dry Soil",
        description: "Leaf burn risk",
        prevention: "Shade net",
        severity: "danger"
      })
    }

    // 5) High TDS + High Temperature
    if (tds !== null && temp !== null && tds > 900 && temp > 35) {
      conditions.push({
        title: "High TDS + High Temperature",
        description: "Salt burn increases",
        prevention: "Dilute water",
        severity: "danger"
      })
    }

    // 6) High Moisture + High Humidity
    if (moisture !== null && humidity !== null && moisture > 80 && humidity > 70) {
      conditions.push({
        title: "Flooding + High Humidity",
        description: "Root rot + fungus",
        prevention: "Stop irrigation",
        severity: "danger"
      })
    }

    // 7) High Gas + High Temperature
    if (gasLevel !== null && temp !== null && gasLevel > 700 && temp > 35) {
      conditions.push({
        title: "Dangerous Gas + High Temperature",
        description: "Chemical + heat damage",
        prevention: "Ventilation",
        severity: "danger"
      })
    }

    // 8) PIR Trigger + Night + Low Light
    if (isMotion && light !== null && light < 200) {
      conditions.push({
        title: "Motion Detected + Low Light (Night)",
        description: "Animal entry detected",
        prevention: "Alarm / SMS",
        severity: "warning"
      })
    }

    return conditions
  }

  // Check conditions and trigger notifications
  const checkAndNotifyConditions = (
    currentData: SensorData, 
    previousData: SensorData,
    currentConditions: Set<string> = new Set()
  ) => {
    if (!onConditionDetected) return

    // Check individual sensor conditions
    const tds = getTDSValue(currentData)
    const temp = getNumericValue(currentData?.temperature)
    const humidity = getNumericValue(currentData?.humidity)
    const moisture = getNumericValue(currentData?.SoilMoisture ?? currentData?.soil_moisture)
    const light = getNumericValue(currentData?.LightLevel ?? currentData?.light)
    const gasLevel = getNumericValue(currentData?.GasLevel ?? currentData?.CO2_ppm)
    const pir = currentData?.PIR ?? currentData?.motion
    const motionDetected = currentData?.motion_detected
    const isMotion = motionDetected === true || 
                     (typeof pir === 'number' && pir === 1) ||
                     (typeof pir === 'string' && pir === '1') ||
                     String(pir).toLowerCase() === 'true'

    // TDS warnings
    if (tds !== null) {
      if (tds > 1200) {
        const key = `tds-very-salty-${tds}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "⚠️ Very Salty Water Detected",
            message: `TDS is ${tds.toFixed(0)} ppm. Avoid using; harvest rainwater.`,
            type: "danger",
            icon: <Droplet className="w-5 h-5" />
          })
        }
      } else if (tds > 900) {
        const key = `tds-bad-${tds}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "⚠️ Bad Water Quality",
            message: `TDS is ${tds.toFixed(0)} ppm. Leaves may turn yellow. Dilute water.`,
            type: "danger",
            icon: <Droplet className="w-5 h-5" />
          })
        }
      } else if (tds > 600) {
        const key = `tds-salty-${tds}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "⚠️ Water Becoming Salty",
            message: `TDS is ${tds.toFixed(0)} ppm. Mix with fresh water.`,
            type: "warning",
            icon: <Droplet className="w-5 h-5" />
        })
        }
      }
    }

    // Temperature warnings
    if (temp !== null) {
      if (temp > 40) {
        const key = `temp-extreme-${temp}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "🔥 Extreme Heat Alert",
            message: `Temperature is ${temp.toFixed(1)}°C. Crop burn risk! Use shade nets and mulching.`,
            type: "danger",
            icon: <Thermometer className="w-5 h-5" />
          })
        }
      } else if (temp > 35) {
        const key = `temp-high-${temp}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "🌡️ High Temperature",
            message: `Temperature is ${temp.toFixed(1)}°C. Leaves may dry. Water morning/evening.`,
            type: "warning",
            icon: <Thermometer className="w-5 h-5" />
          })
        }
      } else if (temp < 15) {
        const key = `temp-cold-${temp}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "❄️ Too Cold",
            message: `Temperature is ${temp.toFixed(1)}°C. Growth slows. Reduce watering.`,
            type: "warning",
            icon: <Thermometer className="w-5 h-5" />
          })
        }
      }
    }

    // Humidity warnings
    if (humidity !== null) {
      if (humidity > 85) {
        const key = `humidity-very-high-${humidity}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "💧 Very High Humidity",
            message: `Humidity is ${humidity.toFixed(0)}%. Disease guaranteed! Ventilate and use fungicide.`,
            type: "danger",
            icon: <Cloud className="w-5 h-5" />
          })
        }
      } else if (humidity > 70) {
        const key = `humidity-high-${humidity}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "💧 High Humidity",
            message: `Humidity is ${humidity.toFixed(0)}%. Fungus risk. Increase ventilation.`,
            type: "warning",
            icon: <Cloud className="w-5 h-5" />
          })
        }
      } else if (humidity < 30) {
        const key = `humidity-low-${humidity}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "💨 Low Humidity",
            message: `Humidity is ${humidity.toFixed(0)}%. Plants dry fast. Increase irrigation.`,
            type: "warning",
            icon: <Cloud className="w-5 h-5" />
          })
        }
      }
    }

    // Soil moisture warnings
    if (moisture !== null) {
      if (moisture > 80) {
        const key = `moisture-flooding-${moisture}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "🌊 Flooding Detected",
            message: `Soil moisture is ${moisture.toFixed(0)}%. Root rot risk! Improve drainage.`,
            type: "danger",
            icon: <Sprout className="w-5 h-5" />
          })
        }
      } else if (moisture < 20) {
        const key = `moisture-dry-${moisture}`
        if (!lastNotifiedConditions.has(key)) {
          currentConditions.add(key)
          onConditionDetected({
            title: "🌵 Dry Soil Alert",
            message: `Soil moisture is ${moisture.toFixed(0)}%. Plants wilting! Start irrigation.`,
            type: "danger",
            icon: <Sprout className="w-5 h-5" />
          })
        }
      }
    }

    // Gas level warnings
    if (gasLevel !== null && gasLevel > 700) {
      const key = `gas-dangerous-${gasLevel}`
      if (!lastNotifiedConditions.has(key)) {
        currentConditions.add(key)
        onConditionDetected({
          title: "☠️ Dangerous Gas Level",
          message: `Gas level is ${gasLevel.toFixed(0)} ppm. Crop damage risk! Ventilate immediately.`,
          type: "danger",
          icon: <Wind className="w-5 h-5" />
        })
      }
    }

    // Light warnings
    if (light !== null && light > 900) {
      const key = `light-very-high-${light}`
      if (!lastNotifiedConditions.has(key)) {
        currentConditions.add(key)
        onConditionDetected({
          title: "☀️ Very High Sunlight",
          message: `Light level is ${light.toFixed(0)}. Leaf burn risk! Use shade net.`,
          type: "warning",
          icon: <Sun className="w-5 h-5" />
        })
      }
    }

    // Motion detection
    if (isMotion) {
      const key = `motion-detected`
      if (!lastNotifiedConditions.has(key)) {
        currentConditions.add(key)
        onConditionDetected({
          title: "👁️ Movement Detected",
          message: "Animal or human movement detected in the field. Activate alarm/light.",
          type: "warning",
          icon: <Eye className="w-5 h-5" />
        })
      }
    }

    // Check mixed conditions
    const mixedConditions = getMixedConditions(currentData)
    mixedConditions.forEach((condition, index) => {
      const key = `mixed-${condition.title}-${index}`
      if (!lastNotifiedConditions.has(key)) {
        currentConditions.add(key)
        onConditionDetected({
          title: `🚨 ${condition.title}`,
          message: `${condition.description}. ${condition.prevention}`,
          type: condition.severity === "danger" ? "danger" : "warning",
        })
      }
    })

    // Return current conditions set (don't update state here, let caller handle it)
    return currentConditions
  }

  // 1. WATER QUALITY (TDS)
  const getWaterQualityStatus = (): SensorStatus => {
    const tds = getTDSValue(sensorData)
    if (tds === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Droplet className="w-6 h-6" />
      }
    }

    if (tds <= 10) {
      return {
        status: "Pure Water (Distilled)",
        prevention: "Use freely; excellent quality",
        severity: "good",
        icon: <Droplet className="w-6 h-6" />
      }
    } else if (tds <= 300) {
      return {
        status: "Tap Water",
        prevention: "Safe to use as-is",
        severity: "good",
        icon: <Droplet className="w-6 h-6" />
      }
    } else if (tds <= 500) {
      return {
        status: "Safe Drinking Water",
        prevention: "Use normally for irrigation",
        severity: "good",
        icon: <Droplet className="w-6 h-6" />
      }
    } else if (tds > 1000) {
      return {
        status: "Fertilizer Solution / High TDS",
        prevention: "Dilute before use; monitor crop stress",
        severity: "danger",
        icon: <Droplet className="w-6 h-6" />
      }
    } else {
      return {
        status: "Moderate Water Quality",
        prevention: "Okay to use; consider blending with fresh water",
        severity: "warning",
        icon: <Droplet className="w-6 h-6" />
      }
    }
  }

  // 2. TEMPERATURE
  const getTemperatureStatus = (): SensorStatus => {
    const temp = getNumericValue(sensorData?.temperature)
    if (temp === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Thermometer className="w-6 h-6" />
      }
    }

    if (temp < 15) {
      return {
        status: "Too Cold - Growth Slow",
        prevention: "Reduce watering",
        severity: "warning",
        icon: <Thermometer className="w-6 h-6" />
      }
    } else if (temp >= 15 && temp <= 35) {
      return {
        status: "Best Temperature",
        prevention: "No action needed",
        severity: "good",
        icon: <Thermometer className="w-6 h-6" />
      }
    } else if (temp > 35 && temp <= 40) {
      return {
        status: "High Heat - Leaves Dry",
        prevention: "Shade nets, morning watering, mulching",
        severity: "warning",
        icon: <Thermometer className="w-6 h-6" />
      }
    } else {
      return {
        status: "Extreme Heat - Crop Burn",
        prevention: "Shade nets, morning watering, mulching",
        severity: "danger",
        icon: <Thermometer className="w-6 h-6" />
      }
    }
  }

  // 3. HUMIDITY
  const getHumidityStatus = (): SensorStatus => {
    const humidity = getNumericValue(sensorData?.humidity)
    if (humidity === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Cloud className="w-6 h-6" />
      }
    }

    if (humidity < 30) {
      return {
        status: "Low Humidity - Plants Dry",
        prevention: "Increase irrigation",
        severity: "warning",
        icon: <Cloud className="w-6 h-6" />
      }
    } else if (humidity >= 30 && humidity <= 70) {
      return {
        status: "Best Humidity",
        prevention: "No action needed",
        severity: "good",
        icon: <Cloud className="w-6 h-6" />
      }
    } else if (humidity > 70 && humidity <= 85) {
      return {
        status: "High Humidity - Fungus Risk",
        prevention: "Ventilation, reduce irrigation, fungicide",
        severity: "warning",
        icon: <Cloud className="w-6 h-6" />
      }
    } else {
      return {
        status: "Very High Humidity - Disease Guaranteed",
        prevention: "Ventilation, reduce irrigation, fungicide",
        severity: "danger",
        icon: <Cloud className="w-6 h-6" />
      }
    }
  }

  // 4. HARMFUL GAS LEVEL (MQ135)
  const getGasLevelStatus = (): SensorStatus => {
    // Use CO2_ppm as primary, or combine with other gas readings
    const gasLevel = getNumericValue(
      sensorData?.GasLevel ?? 
      sensorData?.CO2_ppm ?? 
      sensorData?.NH3_ppm ?? 
      sensorData?.Benzene_ppm ?? 
      sensorData?.Smoke_ppm
    )
    
    if (gasLevel === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Wind className="w-6 h-6" />
      }
    }

    if (gasLevel < 200) {
      return {
        status: "Good Air",
        prevention: "No action needed",
        severity: "good",
        icon: <Wind className="w-6 h-6" />
      }
    } else if (gasLevel >= 200 && gasLevel <= 400) {
      return {
        status: "Moderate Air",
        prevention: "Maintain airflow",
        severity: "warning",
        icon: <Wind className="w-6 h-6" />
      }
    } else if (gasLevel > 400 && gasLevel <= 700) {
      return {
        status: "Poor Air - Harmful Gases",
        prevention: "Stop burning, increase airflow",
        severity: "warning",
        icon: <Wind className="w-6 h-6" />
      }
    } else {
      return {
        status: "Dangerous Gases - Crop Damage",
        prevention: "Stop burning, increase airflow",
        severity: "danger",
        icon: <Wind className="w-6 h-6" />
      }
    }
  }

  // 5. SOIL MOISTURE
  const getSoilMoistureStatus = (): SensorStatus => {
    const moisture = getNumericValue(sensorData?.SoilMoisture ?? sensorData?.soil_moisture)
    if (moisture === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Sprout className="w-6 h-6" />
      }
    }

    if (moisture < 20) {
      return {
        status: "Soil Dry - Water Needed",
        prevention: "Start irrigation",
        severity: "danger",
        icon: <Sprout className="w-6 h-6" />
      }
    } else if (moisture >= 20 && moisture <= 60) {
      return {
        status: "Best Moisture",
        prevention: "No action needed",
        severity: "good",
        icon: <Sprout className="w-6 h-6" />
      }
    } else if (moisture > 60 && moisture <= 80) {
      return {
        status: "Soil Wet - Reduce Water",
        prevention: "Controlled watering, drainage",
        severity: "warning",
        icon: <Sprout className="w-6 h-6" />
      }
    } else {
      return {
        status: "Flooding - Root Rot",
        prevention: "Controlled watering, drainage",
        severity: "danger",
        icon: <Sprout className="w-6 h-6" />
      }
    }
  }

  // 6. PIR MOTION
  const getPIRStatus = (): SensorStatus => {
    const pir = sensorData?.PIR ?? sensorData?.motion
    const motionDetected = sensorData?.motion_detected
    
    // Check if motion is detected (could be 1, true, "1", etc.)
    const isMotion = motionDetected === true || 
                     (typeof pir === 'number' && pir === 1) ||
                     (typeof pir === 'string' && pir === '1') ||
                     String(pir).toLowerCase() === 'true'

    if (isMotion) {
      return {
        status: "Movement Detected - Animal/Human",
        prevention: "Activate alarm/light; send alert",
        severity: "warning",
        icon: <Eye className="w-6 h-6" />
      }
    } else {
      return {
        status: "No Movement",
        prevention: "No action needed",
        severity: "good",
        icon: <Eye className="w-6 h-6" />
      }
    }
  }

  // 7. SUNLIGHT LEVEL (LDR)
  const getLightLevelStatus = (): SensorStatus => {
    const light = getNumericValue(sensorData?.LightLevel ?? sensorData?.light)
    if (light === null) {
      return {
        status: "No Data",
        prevention: "Waiting for sensor reading",
        severity: "warning",
        icon: <Sun className="w-6 h-6" />
      }
    }

    if (light < 200) {
      return {
        status: "Low Sunlight - Slow Growth",
        prevention: "Reduce shading",
        severity: "warning",
        icon: <Sun className="w-6 h-6" />
      }
    } else if (light >= 200 && light <= 700) {
      return {
        status: "Normal Sunlight",
        prevention: "No action needed",
        severity: "good",
        icon: <Sun className="w-6 h-6" />
      }
    } else if (light > 700 && light <= 900) {
      return {
        status: "High Sunlight - Soil Dries Fast",
        prevention: "Shade nets, avoid noon irrigation",
        severity: "warning",
        icon: <Sun className="w-6 h-6" />
      }
    } else {
      return {
        status: "Very High Sunlight - Leaf Burn",
        prevention: "Shade nets, avoid noon irrigation",
        severity: "warning",
        icon: <Sun className="w-6 h-6" />
      }
    }
  }

  const sensorStatuses = [
    { name: "💧 Water Quality", value: getTDSValue(sensorData), unit: "ppm", ...getWaterQualityStatus() },
    { name: "🌡️ Temperature", value: getNumericValue(sensorData?.temperature), unit: "°C", ...getTemperatureStatus() },
    { name: "💨 Air Moisture", value: getNumericValue(sensorData?.humidity), unit: "%", ...getHumidityStatus() },
    { name: "🌬️ Air Quality", value: getNumericValue(sensorData?.GasLevel ?? sensorData?.CO2_ppm), unit: "ppm", ...getGasLevelStatus() },
    { name: "🌱 Soil Water", value: getNumericValue(sensorData?.SoilMoisture ?? sensorData?.soil_moisture), unit: "%", ...getSoilMoistureStatus() },
    { name: "👀 Movement", value: sensorData?.PIR ?? sensorData?.motion ?? (sensorData?.motion_detected ? 1 : 0), unit: "", ...getPIRStatus() },
    { name: "☀️ Sunlight", value: getNumericValue(sensorData?.LightLevel ?? sensorData?.light), unit: "", ...getLightLevelStatus() },
  ]

  const mixedConditions = getMixedConditions()

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "good":
        return "border-green-200 bg-green-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "danger":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "good":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "danger":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-2 text-gray-600">Loading sensor data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-500 mt-2">Make sure sensors are connected and MQTT is running</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Your Farm Status</h2>
        <p className="text-base text-gray-600">See how your farm is doing right now</p>
      </div>

      {/* Mixed Conditions Alert - Compact */}
      {mixedConditions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Card className="border-2 border-red-300 bg-red-50 p-5 rounded-xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold text-red-900">
                Attention Needed!
              </h3>
            </div>
            <div className="space-y-2">
              {mixedConditions.map((condition, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    condition.severity === 'danger'
                      ? 'border-red-400 bg-red-100'
                      : 'border-yellow-400 bg-yellow-100'
                  }`}
                >
                  <div className="text-center mb-2">
                    <h4 className="font-bold text-base text-gray-900 mb-2">{condition.title}</h4>
                    <p className="text-sm text-gray-700 mb-3">{condition.description}</p>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-700">
                        💡 What to do: {condition.prevention}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sensorStatuses.map((sensor, index) => (
          <motion.div
            key={sensor.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`p-5 ${getSeverityColor(sensor.severity)} border-2 rounded-xl`}>
              <div className="text-center">
                <div className="inline-block p-3 bg-white rounded-full mb-3">
                  {sensor.icon}
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">{sensor.name}</h3>
                {sensor.value !== null && sensor.value !== undefined ? (
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof sensor.value === 'number' ? sensor.value.toFixed(1) : sensor.value}
                    </p>
                    <p className="text-sm text-gray-600">{sensor.unit}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3">No data</p>
                )}
                
                <div className={`p-3 rounded-lg mb-2 ${
                  sensor.severity === 'good' ? 'bg-green-100' :
                  sensor.severity === 'warning' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <p className={`font-semibold text-sm ${
                    sensor.severity === 'good' ? 'text-green-800' :
                    sensor.severity === 'warning' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {sensor.severity === 'good' ? '✅' : sensor.severity === 'warning' ? '⚠️' : '❌'} {sensor.status}
                  </p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  💡 {sensor.prevention}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

