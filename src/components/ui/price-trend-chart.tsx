"use client"

import React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface PriceData {
  date: string
  price: number
}

interface CommodityTrend {
  commodity: string
  data: PriceData[]
  color: string
  trend: 'up' | 'down' | 'stable'
}

interface PriceTrendChartProps {
  trends: CommodityTrend[]
  chartType?: 'line' | 'bar'
  className?: string
}

export const PriceTrendChart = ({ 
  trends, 
  chartType = 'line',
  className 
}: PriceTrendChartProps) => {
  const [activeChart, setActiveChart] = React.useState<'line' | 'bar'>(chartType)
  const [selectedCommodity, setSelectedCommodity] = React.useState<string | null>(null)

  // Generate sample data if no trends provided
  const sampleTrends: CommodityTrend[] = trends.length > 0 ? trends : [
    {
      commodity: "Rice",
      color: "#10B981",
      trend: "up",
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
      trend: "down",
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
      trend: "stable",
      data: [
        { date: "2024-01-01", price: 1900 },
        { date: "2024-01-08", price: 1920 },
        { date: "2024-01-15", price: 1940 },
        { date: "2024-01-22", price: 1930 },
        { date: "2024-01-29", price: 1950 },
        { date: "2024-02-05", price: 1960 },
        { date: "2024-02-12", price: 1970 },
      ]
    }
  ]

  const chartData = {
    labels: sampleTrends[0]?.data.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }) || [],
    datasets: sampleTrends.map(trend => ({
      label: trend.commodity,
      data: trend.data.map(d => d.price),
      borderColor: trend.color,
      backgroundColor: trend.color + '20',
      borderWidth: 3,
      pointBackgroundColor: trend.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.4,
      fill: activeChart === 'line' ? false : true,
    }))
  }

  const barData = {
    labels: sampleTrends[0]?.data.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }) || [],
    datasets: sampleTrends.map(trend => ({
      label: trend.commodity,
      data: trend.data.map(d => d.price),
      backgroundColor: trend.color + '80',
      borderColor: trend.color,
      borderWidth: 1,
    }))
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500,
          }
        }
      },
      title: {
        display: true,
        text: 'Price Trends (Last 7 Days)',
        font: {
          size: 16,
          weight: 600,
        },
        color: '#374151'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}/quintal`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#F3F4F6',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return '₹' + value.toLocaleString()
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className={cn("bg-white rounded-lg p-6", className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-semibold text-gray-900">Price Trends</h4>
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveChart('line')}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              activeChart === 'line' 
                ? "bg-white text-green-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Line
          </button>
          <button
            onClick={() => setActiveChart('bar')}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              activeChart === 'bar' 
                ? "bg-white text-green-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 mb-6">
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeChart === 'line' ? (
            <Line data={chartData} options={options} />
          ) : (
            <Bar data={barData} options={options} />
          )}
        </motion.div>
      </div>

      {/* Commodity Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sampleTrends.map((trend, index) => (
          <motion.div
            key={trend.commodity}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              selectedCommodity === trend.commodity 
                ? "border-green-200 bg-green-50" 
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
            onClick={() => setSelectedCommodity(
              selectedCommodity === trend.commodity ? null : trend.commodity
            )}
          >
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: trend.color }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{trend.commodity}</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(trend.trend)}
                <span className={cn("text-sm", getTrendColor(trend.trend))}>
                  {trend.trend}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ₹{trend.data[trend.data.length - 1]?.price.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">per quintal</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Interactive chart - Click legend items to toggle visibility</span>
          <span>Data updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}
