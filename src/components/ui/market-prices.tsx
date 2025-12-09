"use client"

import React from "react"
import { Card } from "./card"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface MarketPricesProps {
  className?: string
  // kept for backward compatibility; currently unused
  location?: string
  autoDetectLocation?: boolean
}

const mockData = [
  { name: "Week 1", price: 42 },
  { name: "Week 2", price: 45 },
  { name: "Week 3", price: 44 },
  { name: "Week 4", price: 46 },
  { name: "Week 5", price: 47 },
]

export const MarketPrices = ({ className }: MarketPricesProps) => {
  return (
    <Card className={cn("p-6 space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Market Intelligence</h3>
        <p className="text-sm text-gray-600">
          Showing mock price trend data (backend prices disabled).
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

