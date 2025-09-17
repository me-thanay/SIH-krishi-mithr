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
  Sprout
} from "lucide-react"
import { NavBar } from "./tubelight-navbar"

export function TubelightNavBarDemo() {
  const navItems = [
    { name: 'Home', url: '#', icon: Home },
    { name: 'Weather', url: '#weather', icon: CloudRain },
    { name: 'Soil', url: '#soil', icon: Leaf },
    { name: 'Market', url: '#market', icon: TrendingUp },
    { name: 'Voice', url: '#voice', icon: Mic },
    { name: 'WhatsApp', url: '#whatsapp', icon: MessageCircle },
    { name: 'Pest', url: '#pest', icon: Bug },
    { name: 'Tools', url: '#tools', icon: Wrench }
  ]

  return <NavBar items={navItems} />
}
