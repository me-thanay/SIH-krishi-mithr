"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface MarketPricesProps {
  className?: string
  // kept for backward compatibility; currently unused
  location?: string
  autoDetectLocation?: boolean
}

// Market prices temporarily disabled to avoid backend 404s on trends endpoint.
export const MarketPrices = ({ className }: MarketPricesProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 text-amber-700">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="text-sm font-semibold">Market prices temporarily disabled</p>
          <p className="text-xs text-amber-700/80">
            This section is disabled to prevent failing API calls. Re-enable when backend support is ready.
          </p>
        </div>
      </div>
    </Card>
  )
}

