"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Navigation
} from "lucide-react"
import { Card } from "./card"
import { Button } from "./button"
import { LocationDetector } from "./location-detector"
import { cn } from "@/lib/utils"
import { controllers } from "chart.js"

interface WeatherData {
  city: string
  temperature: number
  humidity: number
  wind_speed: number
  description: string
  recommendation: string
  feels_like?: number
  pressure?: number
  visibility?: number
  uv_index?: number
}

interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
  accuracy: number
}

interface WeatherWidgetProps {
  className?: string
  city?: string
  showDetails?: boolean
  autoDetectLocation?: boolean
}

export const WeatherWidget = ({ 
  className, 
  city = "Mumbai",
  showDetails = true,
  autoDetectLocation = false
}: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentCity, setCurrentCity] = useState(city)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [showLocationDetector, setShowLocationDetector] = useState(false)

  const fetchWeather = async (targetCity?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const cityToUse = targetCity || currentCity
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8000'
          : '')
      const response = await fetch(`${apiBase}/api/weather/current?city=${cityToUse}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }
      
      const data = await response.json()
      setWeather(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('Unable to fetch weather data')
      
      // Fallback to mock data
      setWeather({
        city: targetCity || currentCity,
        temperature: 28,
        humidity: 65,
        wind_speed: 12,
        description: "Partly cloudy",
        recommendation: "Good conditions for crop growth. Consider light irrigation.",
        feels_like: 30,
        pressure: 1013,
        visibility: 10,
        uv_index: 6
      })
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }

  const handleLocationDetected = (locationData: LocationData) => {
    setLocation(locationData)
    setCurrentCity(locationData.city)
    setShowLocationDetector(false)
    fetchWeather(locationData.city)
  }

  const handleLocationError = (errorMsg: string) => {
    setError(errorMsg)
    setShowLocationDetector(false)
  }

  useEffect(() => {
    fetchWeather()
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [currentCity])

  // Auto-detect location on mount if enabled
  useEffect(() => {
    if (autoDetectLocation && !location) {
      setShowLocationDetector(true)
    }
  }, [autoDetectLocation, location])

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />
    } else if (desc.includes('sun') || desc.includes('clear')) {
      return <Sun className="w-8 h-8 text-yellow-500" />
    } else if (desc.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />
    } else {
      return <Cloud className="w-8 h-8 text-gray-500" />
    }
  }

  const getWeatherColor = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return "from-blue-400 to-blue-600"
    } else if (desc.includes('sun') || desc.includes('clear')) {
      return "from-yellow-400 to-orange-500"
    } else if (desc.includes('cloud')) {
      return "from-gray-400 to-gray-600"
    } else {
      return "from-green-400 to-green-600"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading && !weather) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-600">Loading weather...</span>
        </div>
      </Card>
    )
  }


  if (error && !weather) {
    return (
      <Card className={cn("p-6 border-red-200 bg-red-50", className)}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <p className="font-medium">Weather Unavailable</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!weather) return null

  return (
    <>
      {/* Location Detector Modal */}
      <AnimatePresence>
        {showLocationDetector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLocationDetector(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Detect Location</h3>
                  <Button
                    onClick={() => setShowLocationDetector(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </Button>
                </div>
                <LocationDetector
                  onLocationDetected={handleLocationDetected}
                  onLocationError={handleLocationError}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className={cn("overflow-hidden", className)}>
        {/* Weather Header */}
      <div className={cn(
        "bg-gradient-to-r text-white p-6",
        getWeatherColor(weather.description)
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{weather.city}</h3>
            {location && (
              <span className="text-xs opacity-75">(Auto-detected)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowLocationDetector(true)}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => fetchWeather()}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.description)}
            <div>
              <div className="text-4xl font-bold">{weather.temperature}°C</div>
              <div className="text-lg opacity-90">{weather.description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Feels like</div>
            <div className="text-xl font-semibold">{weather.feels_like || weather.temperature + 2}°C</div>
          </div>
        </div>
      </div>

      {/* Weather Details */}
      {showDetails && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Humidity</div>
                <div className="text-lg font-semibold">{weather.humidity}%</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Wind className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Wind Speed</div>
                <div className="text-lg font-semibold">{weather.wind_speed} km/h</div>
              </div>
            </div>

            {weather.pressure && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pressure</div>
                  <div className="text-lg font-semibold">{weather.pressure} hPa</div>
                </div>
              </div>
            )}

            {weather.visibility && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Visibility</div>
                  <div className="text-lg font-semibold">{weather.visibility} km</div>
                </div>
              </div>
            )}
          </div>

          {/* Agricultural Recommendation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cloud className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-1">Farming Recommendation</h4>
                <p className="text-sm text-green-700">{weather.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-xs text-gray-500 text-center">
              Last updated: {formatTime(lastUpdated)}
            </div>
          )}
        </div>
      )}
      </Card>
    </>
  )
}
