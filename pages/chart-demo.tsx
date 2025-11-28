import React from 'react'
import { PriceTrendChart } from '@/components/ui/price-trend-chart'

type Trend = 'up' | 'down' | 'stable'
type PricePoint = { date: string; price: number }
type CommodityTrend = { commodity: string; color: string; trend: Trend; data: PricePoint[] }

export default function ChartDemo() {
  const sampleTrends: CommodityTrend[] = [
    {
      commodity: "Rice",
      color: "#10B981",
      trend: 'up',
      data: [
        { date: "2024-01-01", price: 2700 },
        { date: "2024-01-08", price: 2750 },
        { date: "2024-01-15", price: 2800 },
        { date: "2024-01-22", price: 2820 },
        { date: "2024-01-29", price: 2850 },
        { date: "2024-02-05", price: 2870 },
        { date: "2024-02-12", price: 2900 },
      ]
    },
    {
      commodity: "Wheat",
      color: "#EF4444",
      trend: 'down',
      data: [
        { date: "2024-01-01", price: 2300 },
        { date: "2024-01-08", price: 2280 },
        { date: "2024-01-15", price: 2250 },
        { date: "2024-01-22", price: 2230 },
        { date: "2024-01-29", price: 2200 },
        { date: "2024-02-05", price: 2180 },
        { date: "2024-02-12", price: 2150 },
      ]
    },
    {
      commodity: "Corn",
      color: "#F59E0B",
      trend: 'stable',
      data: [
        { date: "2024-01-01", price: 1900 },
        { date: "2024-01-08", price: 1920 },
        { date: "2024-01-15", price: 1940 },
        { date: "2024-01-22", price: 1930 },
        { date: "2024-01-29", price: 1950 },
        { date: "2024-02-05", price: 1960 },
        { date: "2024-02-12", price: 1970 },
      ]
    },
    {
      commodity: "Potato",
      color: "#8B5CF6",
      trend: 'up',
      data: [
        { date: "2024-01-01", price: 1100 },
        { date: "2024-01-08", price: 1120 },
        { date: "2024-01-15", price: 1150 },
        { date: "2024-01-22", price: 1180 },
        { date: "2024-01-29", price: 1200 },
        { date: "2024-02-05", price: 1220 },
        { date: "2024-02-12", price: 1250 },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Interactive Price Trend Charts
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore agricultural commodity price trends with interactive charts. 
            Switch between line and bar charts, click legend items to toggle visibility, 
            and hover for detailed price information.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PriceTrendChart 
            trends={sampleTrends} 
            chartType="line"
            className="w-full"
          />
          
          <PriceTrendChart 
            trends={sampleTrends} 
            chartType="bar"
            className="w-full"
          />
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Chart Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Elements</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Toggle between Line and Bar charts</li>
                <li>• Click legend items to show/hide data series</li>
                <li>• Hover over data points for detailed information</li>
                <li>• Responsive design for all screen sizes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Data Visualization</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Real-time price trends over time</li>
                <li>• Color-coded commodities with trend indicators</li>
                <li>• Smooth animations and transitions</li>
                <li>• Professional chart styling and formatting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
