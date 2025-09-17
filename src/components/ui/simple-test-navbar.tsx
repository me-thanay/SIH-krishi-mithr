"use client"

import React from "react"
import { Home, CloudRain, Leaf, TrendingUp, Mic, MessageCircle } from "lucide-react"

export function SimpleTestNavbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white p-4">
      <div className="flex items-center justify-center space-x-4">
        <Home size={20} />
        <CloudRain size={20} />
        <Leaf size={20} />
        <TrendingUp size={20} />
        <Mic size={20} />
        <MessageCircle size={20} />
        <span className="text-sm font-bold">TEST NAVBAR - SHOULD BE VISIBLE</span>
      </div>
    </div>
  )
}
