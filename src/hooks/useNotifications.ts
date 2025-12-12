"use client"

import { useState, useCallback, useRef } from "react"
import { Notification } from "@/components/ui/toast-notification"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const lastNotificationTimestamps = useRef<Record<string, number>>({})
  const TEN_MINUTES_MS = 10 * 60 * 1000

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const key = `${(notification.title || '').trim()}|${(notification.message || '').trim()}`
    const now = Date.now()
    const lastTime = lastNotificationTimestamps.current[key]
    if (lastTime && now - lastTime < TEN_MINUTES_MS) {
      return null
    }

    // Drop stale entries so the map doesn't grow forever
    Object.entries(lastNotificationTimestamps.current).forEach(([k, t]) => {
      if (now - t > TEN_MINUTES_MS) {
        delete lastNotificationTimestamps.current[k]
      }
    })

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    }

    lastNotificationTimestamps.current[key] = now

    setNotifications((prev) => {
      return [...prev, newNotification]
    })

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  }
}

