"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Home, 
  CloudRain, 
  TrendingUp, 
  Mic, 
  Leaf,
  MessageCircle,
  Menu,
  X,
  Sprout
} from "lucide-react"
import { Button } from "./button"

export function SimpleAgriNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Weather', href: '#weather', icon: CloudRain },
    { name: 'Market Prices', href: '#market', icon: TrendingUp },
    { name: 'Voice Assistant', href: '#voice', icon: Mic },
    { name: 'WhatsApp Bot', href: '#whatsapp', icon: MessageCircle }
  ]

  const handleWhatsAppClick = () => {
    const phoneNumber = "7670997498"
    const message = "🌱 Hello! I'm interested in Krishi Mithr's agricultural services. Can you help me get started?"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-green-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Krishi Mithr</h1>
              <p className="text-xs text-gray-600">AI-Powered Agriculture</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 py-2"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Button>
              )
            })}
          </div>

          {/* WhatsApp Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              onClick={handleWhatsAppClick}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <MessageCircle size={18} />
              <span>WhatsApp</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50"
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                )
              })}
              
              {/* Mobile WhatsApp Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                >
                  <MessageCircle size={18} />
                  <span>Contact WhatsApp Bot</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
