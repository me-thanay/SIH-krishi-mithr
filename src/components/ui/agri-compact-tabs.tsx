"use client"

import React from "react"
import { 
  Home, 
  CloudRain, 
  Leaf, 
  TrendingUp, 
  Mic, 
  MessageCircle,
  Bug,
  Users,
  Wrench,
  Sprout
} from "lucide-react"
import { ExpandableTabs, TabItem } from "./expandable-tabs"

interface AgriCompactTabsProps {
  className?: string
  onTabChange?: (index: number | null) => void
}

export function AgriCompactTabs({ className, onTabChange }: AgriCompactTabsProps) {
  const tabs: TabItem[] = [
    { title: "Home", icon: Home },
    { title: "Weather", icon: CloudRain },
    { title: "Soil", icon: Leaf },
    { title: "Market", icon: TrendingUp },
    { type: "separator" },
    { title: "Voice", icon: Mic },
    { title: "WhatsApp", icon: MessageCircle },
    { title: "Pest", icon: Bug },
    { title: "Tools", icon: Wrench },
  ]

  return (
    <div className={className}>
      <ExpandableTabs 
        tabs={tabs} 
        onChange={onTabChange}
        activeColor="text-green-600"
        className="border-green-200 bg-white/90 backdrop-blur-sm shadow-lg" 
      />
    </div>
  )
}

// Floating version for navbar integration
export function AgriFloatingTabs() {
  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      // Handle navigation based on selected tab
      const tabActions = [
        () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        () => document.getElementById('weather')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('soil')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('voice')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('whatsapp')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('pest')?.scrollIntoView({ behavior: 'smooth' }),
        () => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' }),
      ]
      
      if (tabActions[index]) {
        tabActions[index]()
      }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <AgriCompactTabs 
        onTabChange={handleTabChange}
        className="max-w-fit"
      />
    </div>
  )
}
