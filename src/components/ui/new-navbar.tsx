"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { motion } from "framer-motion"
import { 
  Home, 
  BarChart3, 
  Award, 
  User, 
  Cloud, 
  TrendingUp, 
  Leaf, 
  MessageCircle, 
  Sprout,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function NewNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, showAuthModal, logout } = useAuth()

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { name: 'Subsidies', url: '/subsidies', icon: Award },
    { name: 'Weather', url: '/weather', icon: Cloud },
    { name: 'Market Prices', url: '/market-prices', icon: TrendingUp },
    { name: 'Soil Analysis', url: '/soil-analysis', icon: Leaf },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  const handleNavClick = (url: string) => {
    setIsMobileMenuOpen(false)
    router.push(url)
  }

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setIsMobileMenuOpen(false)
    showAuthModal(mode)
  }

  const handleLogout = () => {
    setIsMobileMenuOpen(false)
    logout()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Krishi Mithr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.url
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.url)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-white hover:bg-green-500 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome to Krishi Mithr
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-green-600 focus:outline-none focus:text-green-600"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.url
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.url)}
                    className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-white hover:bg-green-500 hover:shadow-md'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
              
              {/* Mobile User Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2 text-sm text-gray-500">
                  Welcome to Krishi Mithr
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
