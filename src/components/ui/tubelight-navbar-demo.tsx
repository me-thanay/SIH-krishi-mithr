"use client"

import { Home, BarChart3, Award, User, Cloud, TrendingUp, Leaf, MessageCircle, Sprout, LogIn, UserPlus } from 'lucide-react'
import { NavBar } from "./tubelight-navbar"
import { useAuth } from '@/contexts/AuthContext'

export function TubelightNavBarDemo() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { name: 'Subsidies', url: '/subsidies', icon: Award },
    { name: 'Weather', url: '/weather', icon: Cloud },
    { name: 'Market Prices', url: '/market-prices', icon: TrendingUp },
    { name: 'Soil Analysis', url: '/soil-analysis', icon: Leaf },
    { name: 'Profile', url: '/profile', icon: User },
    { name: 'Support', url: '#', icon: MessageCircle }
  ]

  return <NavBar items={navItems} />
}

// Alternative version with fewer items for better mobile experience
export function TubelightNavBarCompact() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { name: 'Subsidies', url: '/subsidies', icon: Award },
    { name: 'Weather', url: '/weather', icon: Cloud },
    { name: 'Profile', url: '/profile', icon: User }
  ]

  return <NavBar items={navItems} />
}