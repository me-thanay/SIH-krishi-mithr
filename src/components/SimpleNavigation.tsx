"use client"

import React from 'react'
import { Sprout, Home, BarChart3, Award, Cloud, TrendingUp, FileText, User, MessageCircle } from 'lucide-react'

export default function SimpleNavigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-green-200">
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
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/subsidies'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Subsidies</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/weather'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <Cloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Weather</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/market-prices'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Market Prices</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/profile'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Profile</span>
            </button>
            
            <button
              onClick={async () => {
                const phoneNumber = '7670997498' // +91 76709 97498
                const message = 'kissan'
                
                try {
                  // Try to send via WhatsApp Business API first
                  const response = await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      phoneNumber: phoneNumber,
                      message: message
                    })
                  })

                  const data = await response.json()

                  if (response.ok && data.success) {
                    alert('Message sent successfully to WhatsApp!')
                  } else {
                    // Fallback to opening WhatsApp if API fails
                    console.log('WhatsApp API not available, opening WhatsApp app')
                    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }
                } catch (error) {
                  // Fallback to opening WhatsApp if API fails
                  console.error('Error sending WhatsApp message:', error)
                  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Support</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
