"use client"

import React, { useState, useEffect } from 'react'
import { 
  Home, 
  BarChart3, 
  Award, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sprout,
  Cloud,
  TrendingUp,
  FileText,
  MessageCircle
} from 'lucide-react'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        // Verify token with server
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    setIsMobileMenuOpen(false)
    window.location.href = '/'
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = '7670997498'
    const message = "Hello, I need help with Krishi Mithr"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      public: true
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      public: false,
      description: 'Your farming dashboard'
    },
    {
      name: 'Subsidies',
      href: '/subsidies',
      icon: Award,
      public: true,
      description: 'Government schemes'
    },
    {
      name: 'Weather',
      href: '/weather',
      icon: Cloud,
      public: true,
      description: 'Weather forecast'
    },
    {
      name: 'Market Prices',
      href: '/market-prices',
      icon: TrendingUp,
      public: true,
      description: 'Crop prices'
    },
    {
      name: 'Soil Analysis',
      href: '/soil-analysis',
      icon: FileText,
      public: true,
      description: 'Soil health check'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      public: false,
      description: 'Your profile'
    }
  ]

  // Always show all items - no auth required
  const filteredItems = navigationItems

  const NavItem = ({ item, onClick }: { item: any, onClick?: () => void }) => (
    <button
      onClick={() => {
        window.location.href = item.href
        onClick?.()
      }}
      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
    >
      <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <div className="text-left">
        <div className="font-medium">{item.name}</div>
        {item.description && (
          <div className="text-xs text-gray-500">{item.description}</div>
        )}
      </div>
    </button>
  )

  return (
    <nav className={`bg-white shadow-sm border-b border-green-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Sprout className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Krishi Mithr</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            
            {/* WhatsApp Support */}
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Support</span>
            </button>

            {/* User Section - Always show guest user */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Guest User</p>
                <p className="text-xs text-gray-500">Welcome to Krishi Mithr</p>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <NavItem key={item.name} item={item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
              
              {/* WhatsApp Support */}
              <button
                onClick={() => {
                  handleWhatsAppClick()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full"
              >
                <MessageCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">WhatsApp Support</div>
                  <div className="text-xs text-gray-500">Get instant help</div>
                </div>
              </button>

              {/* User Section - Always show guest */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">Guest User</p>
                  <p className="text-xs text-gray-500">Welcome to Krishi Mithr</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
