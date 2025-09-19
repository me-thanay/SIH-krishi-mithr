"use client"

import React, { useState, useEffect } from "react"
import { MessageCircle, Wifi, WifiOff } from "lucide-react"

export function WhatsAppStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if WhatsApp bot is running
        const response = await fetch('/api/webhook/whatsapp')
        if (response.ok) {
          setIsOnline(true)
          setLastChecked(new Date())
        } else {
          setIsOnline(false)
        }
      } catch (error) {
        setIsOnline(false)
      }
    }

    // Check status immediately
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center space-x-2 text-sm">
      <MessageCircle size={16} className="text-green-600" />
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <>
            <Wifi size={14} className="text-green-500" />
            <span className="text-green-600 font-medium">Bot Active</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-red-500" />
            <span className="text-red-600">Bot Offline</span>
          </>
        )}
      </div>
      {lastChecked && (
        <span className="text-gray-500 text-xs">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
    </div>
  )
}
