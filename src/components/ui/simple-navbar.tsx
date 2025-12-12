"use client"

import React from "react"
import Link from "next/link"
import { Home, CloudRain, Bug, Leaf, DollarSign, Users, Wrench, MessageCircle } from "lucide-react"

export function SimpleNavbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Weather', url: '/weather', icon: CloudRain },
    { name: 'Pest Detection', url: '/pest-demo', icon: Bug },
    { name: 'Market Prices', url: '/market-demo', icon: DollarSign },
    { name: 'Dealers', url: '/dealers', icon: Users },
    { name: 'Tools', url: '/tools', icon: Wrench },
    { name: 'Chat', url: '/voice-demo', icon: MessageCircle },
    { name: 'Tabs Demo', url: '/expandable-tabs-demo', icon: Wrench }
  ]

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-white shadow-lg border-b">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.url}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
          <div className="text-sm text-gray-500">
            Krishi Mithr
          </div>
        </div>
      </div>
    </div>
  )
}
