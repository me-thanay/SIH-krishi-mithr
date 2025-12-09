"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "./card"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
  actionText?: string
  actionUrl?: string
  requiresAuth?: boolean
}

export const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay = 0, 
  actionText = "Try Now",
  actionUrl,
  requiresAuth = false
}: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const { isAuthenticated, showAuthModal } = useAuth()

  const handleAction = () => {
    // Auth disabled - always allow access
    if (actionUrl) {
      window.location.href = actionUrl
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 hover:border-green-300 group flex flex-col">
        <motion.div
          animate={{ 
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0
          }}
          transition={{ duration: 0.3 }}
          className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600 group-hover:bg-green-200"
        >
          {icon}
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">{description}</p>
        
        {(actionUrl || requiresAuth) && (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-green-600 text-green-600 hover:bg-green-50"
            onClick={handleAction}
          >
            {requiresAuth && !isAuthenticated ? 'Sign In to Access' : actionText}
          </Button>
        )}
      </Card>
    </motion.div>
  )
}
