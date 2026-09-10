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
  SoilMoisture?: number | null
  soil_moisture?: number | null
  PIR?: number | null
  motion?: number | null
  motion_detected?: boolean | null
  LightLevel?: number | null
  light?: number | null
  [key: string]: any
}

interface FarmCondition {
  name: string
  status: string
  whatToDo: string
  why: string
  severity: "good" | "warning" | "danger"
  icon: React.ReactNode
}

export function FarmAnalysis() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getNumericValue = (value: any): number | null => {
    if (value === null || value === undefined) return null
    if (value === "" || value === "--" || value === "null") return null
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? null : num
  }

  const getTDSValue = (data: SensorData | null): number | null => {
    if (!data) return null
    return getNumericValue(
      data.TDS ?? data.tds_ppm ?? data.tds ?? (data as any).TDS_ppm ?? (data as any).tdsValue
    )
  }

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('/api/sensor-data/latest')
        if (!response.ok) throw new Error('Failed to fetch sensor data')
        const result = await response.json()
        if (result.data) {
          setSensorData(result.data)
          setError(null)
        }
      } catch (err: any) {
        console.error('Error fetching sensor data:', err)
        setError(err.message || 'Failed to load sensor data')
      } finally {
        setLoading(false)
      }
    }

    fetchSensorData()
    const interval = setInterval(fetchSensorData, 10000)
    return () => clearInterval(interval)
  }, [])

  const getConditions = (): FarmCondition[] => {
    if (!sensorData) return []

    const tds = getTDSValue(sensorData)
    const temp = getNumericValue(sensorData?.temperature)
    const humidity = getNumericValue(sensorData?.humidity)
    const moisture = getNumericValue(sensorData?.SoilMoisture ?? sensorData?.soil_moisture)
    const light = getNumericValue(sensorData?.LightLevel ?? sensorData?.light)
    const gasLevel = getNumericValue(sensorData?.GasLevel ?? sensorData?.CO2_ppm)
    const pir = sensorData?.PIR ?? sensorData?.motion
    const motionDetected = sensorData?.motion_detected
    const isMotion = motionDetected === true || 
                     (typeof pir === 'number' && pir === 1) ||
                     (typeof pir === 'string' && pir === '1') ||
                     String(pir).toLowerCase() === 'true'

    const conditions: FarmCondition[] = []

    // Water Quality (matches device-side categories)
    if (tds !== null) {
      if (tds <= 10) {
        conditions.push({
          name: "💧 Water Quality",
          status: "Pure Water (Distilled)",
          whatToDo: "Use freely; excellent quality",
          why: "Very low TDS indicates pure water",
          severity: "good",
          icon: <Droplet className="w-6 h-6" />
        })
      } else if (tds <= 300) {
        conditions.push({
          name: "💧 Water Quality",
          status: "Tap Water",
          whatToDo: "Safe to use as-is",
          why: "Typical tap water range",
          severity: "good",
          icon: <Droplet className="w-6 h-6" />
        })
      } else if (tds <= 500) {
        conditions.push({
          name: "💧 Water Quality",
          status: "Safe Drinking Water",
          whatToDo: "Use normally for irrigation",
          why: "Within safe drinking range; good for crops",
          severity: "good",
          icon: <Droplet className="w-6 h-6" />
        })
      } else if (tds > 1000) {
        conditions.push({
          name: "💧 Water Quality",
          status: "Fertilizer Solution / High TDS",
          whatToDo: "Dilute before use; monitor crop stress",
          why: "Very high salts can burn roots and leaves",
          severity: "danger",
          icon: <Droplet className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "💧 Water Quality",
          status: "Moderate Water Quality",
          whatToDo: "Okay to use; consider blending with fresh water",
          why: "Medium TDS — acceptable but monitor sensitive crops",
          severity: "warning",
          icon: <Droplet className="w-6 h-6" />
        })
      }
    }

    // Temperature
    if (temp !== null) {
      if (temp < 15) {
        conditions.push({
          name: "🌡️ Temperature",
          status: "Too Cold",
          whatToDo: "Reduce watering, wait for warmer weather",
          why: "Cold weather slows down plant growth",
          severity: "warning",
          icon: <Thermometer className="w-6 h-6" />
        })
      } else if (temp <= 35) {
        conditions.push({
          name: "🌡️ Temperature",
          status: "Perfect",
          whatToDo: "No action needed",
          why: "Perfect temperature for healthy crop growth",
          severity: "good",
          icon: <Thermometer className="w-6 h-6" />
        })
      } else if (temp <= 40) {
        conditions.push({
          name: "🌡️ Temperature",
          status: "High Heat",
          whatToDo: "Use shade nets, water early morning, add mulch",
          why: "Too much heat dries leaves and slows growth",
          severity: "warning",
          icon: <Thermometer className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "🌡️ Temperature",
          status: "Extreme Heat",
          whatToDo: "Use shade nets immediately, water early morning, add mulch",
          why: "Extreme heat can burn leaves and kill plants",
          severity: "danger",
          icon: <Thermometer className="w-6 h-6" />
        })
      }
    }

    // Humidity
    if (humidity !== null) {
      if (humidity < 30) {
        conditions.push({
          name: "💨 Air Moisture",
          status: "Low - Plants Dry Fast",
          whatToDo: "Increase irrigation frequency",
          why: "Dry air makes plants lose water quickly",
          severity: "warning",
          icon: <Cloud className="w-6 h-6" />
        })
      } else if (humidity <= 70) {
        conditions.push({
          name: "💨 Air Moisture",
          status: "Perfect",
          whatToDo: "No action needed",
          why: "Perfect moisture level for healthy plants",
          severity: "good",
          icon: <Cloud className="w-6 h-6" />
        })
      } else if (humidity <= 85) {
        conditions.push({
          name: "💨 Air Moisture",
          status: "High - Fungus Risk",
          whatToDo: "Improve ventilation, reduce watering, use organic fungicide",
          why: "Too much moisture causes fungal diseases",
          severity: "warning",
          icon: <Cloud className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "💨 Air Moisture",
          status: "Very High - Disease Risk",
          whatToDo: "Improve ventilation immediately, reduce watering, use fungicide",
          why: "Extreme moisture will cause plant diseases",
          severity: "danger",
          icon: <Cloud className="w-6 h-6" />
        })
      }
    }

    // Air Quality
    if (gasLevel !== null) {
      if (gasLevel < 200) {
        conditions.push({
          name: "🌬️ Air Quality",
          status: "Good",
          whatToDo: "No action needed",
          why: "Air is clean and safe for crops",
          severity: "good",
          icon: <Wind className="w-6 h-6" />
        })
      } else if (gasLevel <= 400) {
        conditions.push({
          name: "🌬️ Air Quality",
          status: "Moderate",
          whatToDo: "Keep good airflow in the field",
          why: "Some harmful gases present but manageable",
          severity: "warning",
          icon: <Wind className="w-6 h-6" />
        })
      } else if (gasLevel <= 700) {
        conditions.push({
          name: "🌬️ Air Quality",
          status: "Poor - Harmful Gases",
          whatToDo: "Stop burning waste, improve ventilation",
          why: "Harmful gases can damage crop leaves",
          severity: "warning",
          icon: <Wind className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "🌬️ Air Quality",
          status: "Dangerous - Crop Damage Risk",
          whatToDo: "Stop all burning immediately, improve ventilation urgently",
          why: "Very high gas levels will damage or kill crops",
          severity: "danger",
          icon: <Wind className="w-6 h-6" />
        })
      }
    }

    // Soil Moisture
    if (moisture !== null) {
      if (moisture < 20) {
        conditions.push({
          name: "🌱 Soil Water",
          status: "Too Dry - Plants Wilting",
          whatToDo: "Start irrigation immediately",
          why: "Dry soil causes plants to wilt and die",
          severity: "danger",
          icon: <Sprout className="w-6 h-6" />
        })
      } else if (moisture <= 60) {
        conditions.push({
          name: "🌱 Soil Water",
          status: "Perfect",
          whatToDo: "No action needed",
          why: "Perfect water level for healthy roots",
          severity: "good",
          icon: <Sprout className="w-6 h-6" />
        })
      } else if (moisture <= 80) {
        conditions.push({
          name: "🌱 Soil Water",
          status: "Too Wet - Overwatered",
          whatToDo: "Reduce watering, improve drainage",
          why: "Too much water can damage roots",
          severity: "warning",
          icon: <Sprout className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "🌱 Soil Water",
          status: "Flooding - Root Rot Risk",
          whatToDo: "Stop watering, improve drainage immediately",
          why: "Excess water will rot roots and kill plants",
          severity: "danger",
          icon: <Sprout className="w-6 h-6" />
        })
      }
    }

    // Movement
    conditions.push({
      name: "👀 Movement",
      status: isMotion ? "Movement Detected" : "No Movement",
      whatToDo: isMotion ? "Check the field, activate alarm or light" : "No action needed",
      why: isMotion ? "Something is moving in your field" : "Field is safe, no movement detected",
      severity: isMotion ? "warning" : "good",
      icon: <Eye className="w-6 h-6" />
    })

    // Sunlight
    if (light !== null) {
      if (light < 200) {
        conditions.push({
          name: "☀️ Sunlight",
          status: "Low - Slow Growth",
          whatToDo: "Remove shade or move plants to sunny area",
          why: "Plants need sunlight to grow properly",
          severity: "warning",
          icon: <Sun className="w-6 h-6" />
        })
      } else if (light <= 700) {
        conditions.push({
          name: "☀️ Sunlight",
          status: "Normal",
          whatToDo: "No action needed",
          why: "Perfect sunlight for healthy growth",
          severity: "good",
          icon: <Sun className="w-6 h-6" />
        })
      } else if (light <= 900) {
        conditions.push({
          name: "☀️ Sunlight",
          status: "High - Soil Dries Fast",
          whatToDo: "Use shade nets, water early morning or evening",
          why: "Too much sun dries soil quickly and stresses plants",
          severity: "warning",
          icon: <Sun className="w-6 h-6" />
        })
      } else {
        conditions.push({
          name: "☀️ Sunlight",
          status: "Very High - Leaf Burn Risk",
          whatToDo: "Use shade nets immediately, avoid watering at noon",
          why: "Extreme sunlight can burn leaves and kill plants",
          severity: "warning",
          icon: <Sun className="w-6 h-6" />
        })
      }
    }

    return conditions
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "good":
        return "border-green-300 bg-green-50"
      case "warning":
        return "border-yellow-300 bg-yellow-50"
      case "danger":
        return "border-red-300 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <p className="mt-3 text-gray-600">Loading farm analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-semibold">{error}</p>
        <p className="text-sm text-gray-500 mt-2">Make sure sensors are connected</p>
      </div>
    )
  }

  const conditions = getConditions()
  const dangerConditions = conditions.filter(c => c.severity === "danger")
  const warningConditions = conditions.filter(c => c.severity === "warning")
  const goodConditions = conditions.filter(c => c.severity === "good")

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🌾 How is Your Farm?</h2>
        <p className="text-lg text-gray-600">Simple analysis of what's happening and what you need to do</p>
      </div>

      {/* Priority Alerts */}
      {dangerConditions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Urgent Actions Needed
          </h3>
          {dangerConditions.map((condition, index) => (
            <motion.div
              key={condition.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 ${getSeverityColor(condition.severity)} border-2`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg flex-shrink-0">
                    {condition.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{condition.name}</h4>
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <p className="font-semibold text-red-700 text-lg mb-1">Status: {condition.status}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <p className="font-semibold text-gray-900 mb-1">💡 What to Do:</p>
                      <p className="text-gray-700">{condition.whatToDo}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-1">❓ Why:</p>
                      <p className="text-gray-600 text-sm">{condition.why}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warningConditions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-yellow-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Needs Attention
          </h3>
          {warningConditions.map((condition, index) => (
            <motion.div
              key={condition.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-5 ${getSeverityColor(condition.severity)} border-2`}>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    {condition.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-gray-900 mb-2">{condition.name}</h4>
                    <p className="font-semibold text-yellow-700 mb-2">Status: {condition.status}</p>
                    <p className="text-gray-700 mb-2"><span className="font-semibold">What to Do:</span> {condition.whatToDo}</p>
                    <p className="text-gray-600 text-sm"><span className="font-semibold">Why:</span> {condition.why}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* All Good */}
      {goodConditions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            All Good
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goodConditions.map((condition, index) => (
              <motion.div
                key={condition.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-4 ${getSeverityColor(condition.severity)} border-2`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      {condition.icon}
                    </div>
                    <h4 className="font-bold text-base text-gray-900">{condition.name}</h4>
                  </div>
                  <p className="text-green-700 font-semibold mb-1">{condition.status}</p>
                  <p className="text-gray-600 text-sm">{condition.whatToDo}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {conditions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No sensor data available yet. Please wait for sensors to connect.</p>
        </Card>
      )}
    </div>
  )
}

