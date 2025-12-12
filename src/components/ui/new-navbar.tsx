"use client"

import React, { useState, useEffect } from "react"
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
  LogOut,
  Power
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function NewNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Default to operations so landing view matches primary tab
  const [activeTab, setActiveTab] = useState<string>('operations')
  const router = useRouter()
  const { user, isAuthenticated, showAuthModal, logout } = useAuth()

  // Check hash on mount and hash changes
  useEffect(() => {
    const updateActiveTab = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '')
        if (hash === 'operations' || hash === 'analysis' || hash === 'questions') {
          setActiveTab(hash)
        } else {
          setActiveTab('operations')
        }
      }
    }
    
    updateActiveTab()
    window.addEventListener('hashchange', updateActiveTab)
    return () => window.removeEventListener('hashchange', updateActiveTab)
  }, [])

  const navItems = [
    // Single primary entry for the main dashboard
    { name: 'Home', url: '/#operations', icon: Home, isTab: true },
    { name: 'Farm Analysis', url: '/#analysis', icon: BarChart3, isTab: true },
    { name: 'Questions', url: '/#questions', icon: MessageCircle, isTab: true },
    { name: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  ]

  const handleNavClick = (url: string, isTab?: boolean) => {
    setIsMobileMenuOpen(false)
    if (isTab) {
      // For tab navigation, update the hash and trigger custom event
      const tab = url.split('#')[1] || 'operations'
      setActiveTab(tab)
      window.location.hash = tab
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } else {
      router.push(url)
    }
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
              const tabHash = item.isTab ? item.url.split('#')[1] : ''
              const isActive = (item.isTab && activeTab === tabHash) || (!item.isTab && router.pathname === item.url)
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.url, item.isTab)}
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
                const tabHash = item.isTab ? item.url.split('#')[1] : ''
              const isActive = (item.isTab && activeTab === tabHash) || (!item.isTab && router.pathname === item.url)
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.url, item.isTab)}
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
