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
    // Weather API is disabled - use mock data directly
    setLoading(true)
    setError(null)
    
    // Use mock forecast data (no API call)
    const mockForecast: ForecastDay[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
      const dayNames = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5']
      const descriptions = ['Sunny', 'Cloudy', 'Partly cloudy', 'Rainy', 'Clear']
      const recommendations = [
        'Ideal for planting',
        'Monitor soil moisture',
        'Good for harvesting',
        'Cover crops',
        'Resume field work'
      ]
      
      return {
        date: i < dayNames.length ? dayNames[i] : date.toLocaleDateString(),
        temperature: 25 + Math.floor(Math.random() * 8), // 25-32°C
        humidity: 60 + Math.floor(Math.random() * 15), // 60-75%
        description: descriptions[i % descriptions.length],
        recommendation: recommendations[i % recommendations.length]
      }
    })
    
    setForecast(mockForecast)
    setLoading(false)
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
