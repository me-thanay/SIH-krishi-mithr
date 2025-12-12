"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Droplet,
  Thermometer,
  Cloud,
  Wind,
  Sprout,
  Eye,
  Sun
} from "lucide-react"

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "danger" | "info"
  icon?: React.ReactNode
  duration?: number
}

interface ToastNotificationProps {
  notification: Notification
  onClose: (id: string) => void
}

function ToastNotification({ notification, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const duration = notification.duration || 5000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(notification.id), 300) // Wait for animation
    }, duration)

    return () => clearTimeout(timer)
  }, [notification.id, notification.duration, onClose])

  const getIcon = () => {
    if (notification.icon) return notification.icon
    
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />
      case "warning":
        return <AlertTriangle className="w-5 h-5" />
      case "danger":
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "danger":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  const getIconColor = () => {
    switch (notification.type) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "danger":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg max-w-md ${getColors()}`}
    >
      <div className={`flex-shrink-0 ${getIconColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
        <p className="text-xs leading-relaxed">{notification.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose(notification.id), 300)
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  notifications: Notification[]
  onClose: (id: string) => void
}

export function ToastContainer({ notifications, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <ToastNotification
              notification={notification}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

