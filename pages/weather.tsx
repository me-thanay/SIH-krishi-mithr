"use client"

import React, { useState, useEffect } from 'react'
import { Cloud, Thermometer, Droplets, Wind, Sun, Moon, Calendar, MapPin, Navigation } from 'lucide-react'
import { NewNavbar } from '../src/components/ui/new-navbar'

interface WeatherData {
  current: {
    temperature: number
    humidity: number
    condition: string
    farming_conditions: {
      irrigation_needed: boolean
      good_growing: boolean
      planting_suitable: boolean
    }
  }
  forecast: Array<{
    date: string
    temperature: number
    condition: string
    max_temp?: number
    min_temp?: number
    precipitation?: number
  }>
  source: string
  location?: string
}

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [selectedCity, setSelectedCity] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<LocationData | null>(null)
  const [nearbyCities, setNearbyCities] = useState<string[]>([])
  const [isDetectingLocation, setIsDetectingLocation] = useState(true)

  // Indian cities with their approximate coordinates for distance calculation
  const indianCities = [
    { name: 'mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
    { name: 'delhi', lat: 28.7041, lng: 77.1025, state: 'Delhi' },
    { name: 'bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
    { name: 'hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
    { name: 'chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
    { name: 'kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
    { name: 'pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
    { name: 'ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
    { name: 'jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
    { name: 'lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
    { name: 'kanpur', lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
    { name: 'nagpur', lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
    { name: 'indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
    { name: 'bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
    { name: 'visakhapatnam', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
    { name: 'patna', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
    { name: 'vadodara', lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
    { name: 'ghaziabad', lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
    { name: 'ludhiana', lat: 30.9010, lng: 75.8573, state: 'Punjab' },
    { name: 'agra', lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' }
  ]

  useEffect(() => {
    detectUserLocation()
  }, [])

  const detectUserLocation = async () => {
    setIsDetectingLocation(true)
    setError(null)

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // Reverse geocoding to get city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            const data = await response.json()
            
            const detectedCity = data.city || data.locality || 'mumbai'
            const detectedState = data.principalSubdivision || 'Maharashtra'
            
            setUserLocation({
              city: detectedCity.toLowerCase(),
              state: detectedState,
              country: data.countryName || 'India',
              latitude,
              longitude
            })
            
            setSelectedCity(detectedCity.toLowerCase())
            
            // Find nearby cities
            const nearby = findNearbyCities(latitude, longitude)
            setNearbyCities(nearby)
            
            // Fetch weather for detected location
            await fetchWeatherData(detectedCity.toLowerCase())
            setIsDetectingLocation(false)
          },
          (error) => {
            console.error('Location detection failed:', error)
            // Fallback to Mumbai
            setSelectedCity('mumbai')
            setNearbyCities(['pune', 'nagpur', 'ahmedabad'])
            fetchWeatherData('mumbai')
            setIsDetectingLocation(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      } else {
        // Fallback if geolocation not supported
        setSelectedCity('mumbai')
        setNearbyCities(['pune', 'nagpur', 'ahmedabad'])
        fetchWeatherData('mumbai')
        setIsDetectingLocation(false)
      }
    } catch (error) {
      console.error('Location detection error:', error)
      setSelectedCity('mumbai')
      setNearbyCities(['pune', 'nagpur', 'ahmedabad'])
      fetchWeatherData('mumbai')
      setIsDetectingLocation(false)
    }
  }

  const findNearbyCities = (userLat: number, userLng: number) => {
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371 // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }

    const citiesWithDistance = indianCities.map(city => ({
      ...city,
      distance: calculateDistance(userLat, userLng, city.lat, city.lng)
    }))

    // Sort by distance and return top 4 nearby cities (excluding current city)
    return citiesWithDistance
      .filter(city => city.name !== selectedCity)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
      .map(city => city.name)
  }

  const fetchWeatherData = async (city: string) => {
    // Weather API is disabled - use mock data directly
    setIsLoading(true)
    setError(null)
    
    // Use mock data directly (no API call)
    setWeatherData({
      current: {
        temperature: {
          current: 28,
          feels_like: 30,
          min: 25,
          max: 32
        },
        humidity: 65,
        wind: {
          speed: 3.5,
          direction: 180
        },
        weather: {
          main: 'Clear',
          description: 'Weather API disabled',
          icon: '01d'
        },
        farming_conditions: {
          irrigation_needed: false,
          crop_stress: false,
          good_growing: true,
          planting_suitable: true,
          harvesting_suitable: true
        }
      }
    })
    setIsLoading(false)
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    fetchWeatherData(city)
  }

  const refreshLocation = () => {
    detectUserLocation()
  }

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <Droplets className="w-8 h-8 text-blue-500" />
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />
    } else if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className="w-8 h-8 text-yellow-500" />
    } else {
      return <Cloud className="w-8 h-8 text-gray-400" />
    }
  }

  const getFarmingAdvice = (conditions: any) => {
    const advice = []
    if (conditions.irrigation_needed) {
      advice.push('💧 Irrigation recommended')
    }
    if (conditions.good_growing) {
      advice.push('🌱 Good growing conditions')
    }
    if (conditions.planting_suitable) {
      advice.push('🌿 Suitable for planting')
    }
    return advice
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-blue-500" />
            Weather Forecast
          </h1>
          <p className="text-gray-600 mt-2">
            Get real-time weather data and farming recommendations for your location
          </p>
        </div>

        {/* Location Detection Status */}
        {isDetectingLocation ? (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-blue-900">Detecting Your Location</h3>
                <p className="text-blue-700">Please allow location access for personalized weather data</p>
              </div>
            </div>
          </div>
        ) : userLocation ? (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">
                    Current Location: {userLocation.city.charAt(0).toUpperCase() + userLocation.city.slice(1)}
                  </h3>
                  <p className="text-green-700">{userLocation.state}, {userLocation.country}</p>
                </div>
              </div>
              <button
                onClick={refreshLocation}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Refresh Location
              </button>
            </div>
          </div>
        ) : null}

        {/* Nearby Cities Selector */}
        {nearbyCities.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nearby Cities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {nearbyCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityChange(city)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCity === city
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
                  }`}
                >
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weather Data */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading weather data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Weather</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchWeatherData(selectedCity)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : weatherData ? (
          <div className="space-y-8">
            {/* Current Weather */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Weather - {weatherData.location || selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
                </h2>
                <div className="text-sm text-gray-500">
                  Source: {weatherData.source}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Temperature */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getWeatherIcon(weatherData.current.condition)}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {weatherData.current.temperature}°C
                  </div>
                  <div className="text-gray-600">{weatherData.current.condition}</div>
                </div>

                {/* Humidity */}
                <div className="text-center">
                  <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {weatherData.current.humidity}%
                  </div>
                  <div className="text-gray-600">Humidity</div>
                </div>

                {/* Farming Conditions */}
                <div className="text-center">
                  <Wind className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-2">Farming Advice</div>
                  <div className="space-y-1">
                    {getFarmingAdvice(weatherData.current.farming_conditions).map((advice, index) => (
                      <div key={index} className="text-xs text-green-600">{advice}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast */}
            {weatherData.forecast && weatherData.forecast.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  3-Day Forecast
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {day.temperature}°C
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{day.condition}</div>
                      {day.max_temp && day.min_temp && (
                        <div className="text-xs text-gray-500">
                          H: {day.max_temp}°C L: {day.min_temp}°C
                        </div>
                      )}
                      {day.precipitation !== undefined && (
                        <div className="text-xs text-blue-600 mt-1">
                          💧 {day.precipitation}mm
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}