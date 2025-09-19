import React from 'react'
import { Sprout, Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 animate-pulse">
          <Sprout className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Loading Krishi Mithr...
        </h2>
        
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
          <p className="text-gray-600">Please wait while we prepare your agricultural dashboard</p>
        </div>
        
        <div className="mt-8 space-y-2 text-sm text-gray-500">
          <p>🌱 Loading weather data...</p>
          <p>💰 Fetching market prices...</p>
          <p>🌾 Preparing farming advice...</p>
        </div>
      </div>
    </div>
  )
}
