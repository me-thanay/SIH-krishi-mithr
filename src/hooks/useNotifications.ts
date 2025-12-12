"use client"

import { useState, useCallback } from "react"
import { Notification } from "@/components/ui/toast-notification"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    }
    
    setNotifications((prev) => {
      // Check if similar notification already exists (same title and message)
      const exists = prev.some(
        (n) => n.title === newNotification.title && n.message === newNotification.message
      )
      if (exists) return prev
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

