"use client"

import { Home, BarChart3, Award, User, Cloud, TrendingUp, Leaf, MessageCircle, Sprout, LogIn, UserPlus } from 'lucide-react'
import { NavBar } from "./tubelight-navbar"
import { useAuth } from '@/contexts/AuthContext'

export function TubelightNavBarDemo() {
  const { isAuthenticated, showAuthModal, isAuthModalOpen } = useAuth()

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
  // Add auth buttons for non-authenticated users
  const authItems = [
    { name: 'Sign In', url: '#', icon: LogIn, onClick: () => showAuthModal('login') },
    { name: 'Sign Up', url: '#', icon: UserPlus, onClick: () => showAuthModal('signup') }
  ]
  const allItems = isAuthenticated ? navItems : [...navItems.slice(0, 4), ...authItems]

  return isAuthModalOpen ? null : <NavBar items={allItems} />
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