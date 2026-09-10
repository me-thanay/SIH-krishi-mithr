"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
  accuracy: number
}

interface LocationDetectorProps {
  onLocationDetected: (location: LocationData) => void
  onLocationError: (error: string) => void
  className?: string
}

export const LocationDetector = ({ 
  onLocationDetected, 
  onLocationError,
  className 
}: LocationDetectorProps) => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser"
      setError(errorMsg)
      onLocationError(errorMsg)
      return
    }

    setIsDetecting(true)
    setError(null)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords
          
          // Reverse geocoding to get city name
          const cityData = await reverseGeocode(latitude, longitude)
          
          const locationData: LocationData = {
            latitude,
            longitude,
            city: cityData.city || 'Unknown City',
            state: cityData.state || 'Unknown State',
            country: cityData.country || 'Unknown Country',
            accuracy
          }

          setLocation(locationData)
          onLocationDetected(locationData)
          setPermissionStatus('granted')
        } catch (err) {
          console.error('Location processing error:', err)
          const errorMsg = "Failed to process location data"
          setError(errorMsg)
          onLocationError(errorMsg)
        } finally {
          setIsDetecting(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMsg = "Location detection failed"
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location access denied. Please enable location permissions."
            setPermissionStatus('denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMsg = "Location request timed out"
            break
          default:
            errorMsg = "An unknown error occurred"
            break
        }
        
        setError(errorMsg)
        onLocationError(errorMsg)
        setIsDetecting(false)
      },
      options
    )
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      
      return {
        city: data.city || data.locality || 'Unknown City',
        state: data.principalSubdivision || 'Unknown State',
        country: data.countryName || 'Unknown Country'
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      // Fallback to coordinates-based city name
      return {
        city: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        state: 'Unknown State',
        country: 'Unknown Country'
      }
    }
  }

  const checkPermissionStatus = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        const mapped: 'unknown' | 'granted' | 'denied' =
          permission.state === 'granted' ? 'granted' :
          permission.state === 'denied' ? 'denied' : 'unknown'
        setPermissionStatus(mapped)
      } catch (err) {
        console.error('Permission check error:', err)
      }
    }
  }

  useEffect(() => {
    checkPermissionStatus()
  }, [])

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Navigation className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">Location Detection</h3>
      </div>

      {isDetecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"
            />
            <p className="text-gray-600">Detecting your location...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </motion.div>
      )}

      {location && !isDetecting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Location Detected Successfully</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">{location.city}</span>
              </div>
              <div className="text-sm text-green-700">
                {location.state}, {location.country}
              </div>
              <div className="text-xs text-green-600">
                Accuracy: ±{Math.round(location.accuracy)}m
              </div>
            </div>
          </div>

          <Button
            onClick={detectLocation}
            variant="outline"
            size="sm"
            className="w-full border-green-600 text-green-600 hover:bg-green-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Location
          </Button>
        </motion.div>
      )}

      {error && !isDetecting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Location Detection Failed</span>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>

          {permissionStatus === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">How to Enable Location:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Click the location icon in your browser's address bar</li>
                <li>• Select "Allow" for location access</li>
                <li>• Refresh the page and try again</li>
              </ul>
            </div>
          )}

          <Button
            onClick={detectLocation}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      )}

      {!location && !error && !isDetecting && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Get weather for your current location</p>
            <p className="text-sm text-gray-500">
              We'll use your location to provide accurate weather data
            </p>
          </div>

          <Button
            onClick={detectLocation}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Detect My Location
          </Button>
        </div>
      )}
    </Card>
  )
}
