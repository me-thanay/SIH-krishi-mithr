"use client"

import React from "react"
import { 
  Home, 
  CloudRain, 
  Leaf, 
  TrendingUp, 
  Mic, 
  MessageCircle,
  Camera,
  Bug,
  Users,
  Wrench,
  Sprout,
  Thermometer,
  DollarSign,
  Volume2,
  RefreshCw,
  Heart,
  Smartphone,
  Brain,
  Shield,
  Settings,
  HelpCircle,
  FileText,
  Lock
} from "lucide-react"
import { ExpandableTabs, TabItem } from "./expandable-tabs"

// Main Krishi Mithr Navigation Tabs
export function AgriMainTabsDemo() {
  const tabs: TabItem[] = [
    { title: "Home", icon: Home },
    { title: "Weather", icon: CloudRain },
    { title: "Soil Analysis", icon: Leaf },
    { type: "separator" },
    { title: "Market Prices", icon: TrendingUp },
    { title: "Voice Assistant", icon: Mic },
    { title: "WhatsApp Bot", icon: MessageCircle },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-800">Krishi Mithr Main Navigation</h3>
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-green-600"
        className="border-green-200 bg-green-50/50" 
      />
    </div>
  )
}

// Tools & Services Tabs
export function AgriToolsTabsDemo() {
  const tabs: TabItem[] = [
    { title: "Pest Detection", icon: Bug },
    { title: "Soil Scanner", icon: Camera },
    { title: "Weather Forecast", icon: Thermometer },
    { type: "separator" },
    { title: "Market Trends", icon: DollarSign },
    { title: "Voice Support", icon: Volume2 },
    { title: "Dealer Network", icon: Users },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-800">Farming Tools & Services</h3>
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-blue-600"
        className="border-blue-200 bg-blue-50/50" 
      />
    </div>
  )
}

// Advanced Features Tabs
export function AgriAdvancedTabsDemo() {
  const tabs: TabItem[] = [
    { title: "AI Advisory", icon: Brain },
    { title: "Crop Monitoring", icon: Sprout },
    { title: "Health Check", icon: Heart },
    { type: "separator" },
    { title: "Mobile App", icon: Smartphone },
    { title: "Real-time Updates", icon: RefreshCw },
    { title: "Security", icon: Shield },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-800">Advanced Features</h3>
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-purple-600"
        className="border-purple-200 bg-purple-50/50" 
      />
    </div>
  )
}

// Settings & Support Tabs
export function AgriSettingsTabsDemo() {
  const tabs: TabItem[] = [
    { title: "Profile", icon: Users },
    { title: "Settings", icon: Settings },
    { title: "Help Center", icon: HelpCircle },
    { type: "separator" },
    { title: "Documents", icon: FileText },
    { title: "Privacy", icon: Lock },
    { title: "Support", icon: MessageCircle },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-800">Account & Support</h3>
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-orange-600"
        className="border-orange-200 bg-orange-50/50" 
      />
    </div>
  )
}

// Comprehensive Demo with all tabs
export function AgriComprehensiveTabsDemo() {
  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      console.log(`Selected tab index: ${index}`)
    }
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Krishi Mithr Expandable Tabs</h1>
        <p className="text-gray-600">Interactive navigation components for your farming platform</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <AgriMainTabsDemo />
        <AgriToolsTabsDemo />
        <AgriAdvancedTabsDemo />
        <AgriSettingsTabsDemo />
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Demo with Callback</h3>
          <ExpandableTabs 
            tabs={[
              { title: "Dashboard", icon: Home },
              { title: "Weather", icon: CloudRain },
              { title: "Soil", icon: Leaf },
              { type: "separator" },
              { title: "Market", icon: TrendingUp },
              { title: "Voice", icon: Mic },
              { title: "Support", icon: MessageCircle },
            ]}
            onChange={handleTabChange}
            activeColor="text-green-600"
            className="border-green-200 bg-green-50/50"
          />
          <p className="text-sm text-gray-500 mt-2">
            Check console for tab selection events
          </p>
        </div>
      </div>
    </div>
  )
}