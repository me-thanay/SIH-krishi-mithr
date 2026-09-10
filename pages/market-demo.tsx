import React from 'react'
import { MarketPrices } from '@/components/ui/market-prices'

export default function MarketDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Market Intelligence Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Real-time market prices and trends for agricultural commodities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MarketPrices 
            location="Punjab" 
            autoDetectLocation={true}
            className="w-full"
          />
          
          <MarketPrices 
            location="Haryana" 
            autoDetectLocation={false}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
