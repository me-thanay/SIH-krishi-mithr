"use client"

import React from "react"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface MarketPricesProps {
  className?: string
  // kept for backward compatibility; currently unused
  location?: string
  autoDetectLocation?: boolean
}

export const MarketPrices = ({ className }: MarketPricesProps) => {
  return (
    <Card className={cn("p-6 space-y-2", className)}>
      <h3 className="text-lg font-semibold text-gray-900">Market Intelligence</h3>
      <p className="text-sm text-gray-600">
        Backend market API is disabled. Showing placeholder info.
      </p>
      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
        <li>Tomato: ₹45/kg (mock)</li>
        <li>Onion: ₹38/kg (mock)</li>
        <li>Potato: ₹25/kg (mock)</li>
      </ul>
    </Card>
  )
}

