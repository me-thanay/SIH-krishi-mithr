"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer,
  Calendar,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Card } from "./card"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ForecastDay {
  date: string
  temperature: number
  humidity: number
  description: string
  recommendation: string
}

interface WeatherForecastProps {
  className?: string
  city?: string
  days?: number
}

export const WeatherForecast = ({ 
  className, 
  city = "Mumbai",
  days = 5 
}: WeatherForecastProps) => {
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8000'
          : '')
      // Remove trailing slash to avoid double slashes
      apiBase = apiBase.replace(/\/+$/, '')
      const response = await fetch(`${apiBase}/api/weather/forecast?city=${city}&days=${days}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data')
      }
      
      const data = await response.json()
      setForecast(data.forecast || [])
    } catch (err) {
      console.error('Forecast fetch error:', err)
      setError('Unable to fetch forecast data')
      
      // Fallback to mock data
      setForecast([
        {
          date: "Today",
          temperature: 28,
          humidity: 65,
          description: "Sunny",
          recommendation: "Ideal for planting"
        },
        {
          date: "Tomorrow",
          temperature: 26,
          humidity: 70,
          description: "Cloudy",
          recommendation: "Monitor soil moisture"
        },
        {
          date: "Day 3",
          temperature: 30,
          humidity: 60,
          description: "Partly cloudy",
          recommendation: "Good for harvesting"
        },
        {
          date: "Day 4",
          temperature: 24,
          humidity: 75,
          description: "Rainy",
          recommendation: "Cover crops"
        },
        {
          date: "Day 5",
          temperature: 27,
          humidity: 68,
          description: "Sunny",
          recommendation: "Resume field work"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast()
  }, [city, days])

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudRain className="w-6 h-6 text-blue-500" />
    } else if (desc.includes('sun') || desc.includes('clear')) {
      return <Sun className="w-6 h-6 text-yellow-500" />
    } else if (desc.includes('cloud')) {
      return <Cloud className="w-6 h-6 text-gray-500" />
    } else {
      return <Cloud className="w-6 h-6 text-gray-500" />
    }
  }

  const getTemperatureTrend = (index: number) => {
    if (index === 0) return null
    const current = forecast[index].temperature
    const previous = forecast[index - 1].temperature
    
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-red-500" />
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-blue-500" />
    }
    return null
  }

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-600">Loading forecast...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("p-6 border-red-200 bg-red-50", className)}>
        <div className="text-center text-red-600">
          <p className="font-medium">Forecast Unavailable</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">5-Day Weather Forecast</h3>
        </div>
        <Button
          onClick={fetchForecast}
          disabled={loading}
          size="sm"
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {forecast.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-center min-w-[60px]">
                <div className="text-sm font-medium text-gray-600">{day.date}</div>
                <div className="text-xs text-gray-500">
                  {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getWeatherIcon(day.description)}
                <div>
                  <div className="font-medium text-gray-800">{day.description}</div>
                  <div className="text-sm text-gray-600">{day.recommendation}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Humidity</div>
                <div className="text-lg font-semibold text-gray-800">{day.humidity}%</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Temperature</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-gray-800">{day.temperature}°C</span>
                  {getTemperatureTrend(index)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agricultural Insights */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Agricultural Insights</h4>
        <div className="space-y-2 text-sm text-green-700">
          <p>• Monitor soil moisture levels during cloudy periods</p>
          <p>• Plan irrigation around rainfall predictions</p>
          <p>• Adjust planting schedules based on temperature trends</p>
          <p>• Protect crops during extreme weather conditions</p>
        </div>
      </div>
    </Card>
  )
}
