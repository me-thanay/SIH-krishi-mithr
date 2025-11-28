"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Home, 
  CloudRain, 
  Camera, 
  TrendingUp, 
  Mic, 
  Leaf,
  Bug,
  DollarSign,
  Users,
  Wrench,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
  Sprout,
  Brain,
  Thermometer,
  Volume2
} from "lucide-react"
import { Button } from "./button"
import { WhatsAppStatus } from "./whatsapp-status"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  description?: string
}

interface DropdownItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
}

export function SmartAgriTechNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Weather', href: '#weather', icon: CloudRain, description: 'Live weather updates & forecasts' },
    { name: 'Soil Analysis', href: '#soil', icon: Leaf, description: 'AI-powered soil health analysis' },
    { name: 'Market Prices', href: '#market', icon: TrendingUp, description: 'Real-time commodity prices' },
    { name: 'Voice Assistant', href: '#voice', icon: Mic, description: 'Voice-enabled farming support' },
    { name: 'WhatsApp Bot', href: '#whatsapp', icon: MessageCircle, description: 'Direct farmer support' }
  ]

  // Dropdown items for Tools section
  const toolsDropdown: DropdownItem[] = [
    { name: 'Pest Detection', href: '#pest', icon: Bug, description: 'AI-powered pest identification' },
    { name: 'Dealer Network', href: '#dealers', icon: Users, description: 'Find trusted agricultural dealers' },
    { name: 'Farming Tools', href: '#tools', icon: Wrench, description: 'Essential farming equipment' },
    { name: 'Crop Advisory', href: '#advisory', icon: Sprout, description: 'Personalized crop recommendations' }
  ]

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle smooth scrolling to sections
  const handleSmoothScroll = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setIsMobileMenuOpen(false)
    setActiveDropdown(null)
  }

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    const phoneNumber = "7670997498"
    const message = "🌱 Hello! I'm interested in Krishi Mithr's agricultural services. Can you help me get started?"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-green-200' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center"
            >
              <Sprout className="w-6 h-6 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Krishi Mithr</h1>
              <p className="text-xs text-gray-600">AI-Powered Agriculture</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  {item.name === 'Tools' ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveDropdown('tools')}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 py-2"
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                        <ChevronDown size={14} />
                      </Button>
                      
                      {/* Tools Dropdown */}
                      <AnimatePresence>
                        {activeDropdown === 'tools' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                          >
                            {toolsDropdown.map((tool) => {
                              const ToolIcon = tool.icon
                              return (
                                <Link
                                  key={tool.name}
                                  href={tool.href}
                                  onClick={() => handleSmoothScroll(tool.href)}
                                  className="flex items-center space-x-3 px-4 py-3 hover:bg-green-50 transition-colors"
                                >
                                  <ToolIcon size={16} className="text-green-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">{tool.name}</p>
                                    <p className="text-xs text-gray-600">{tool.description}</p>
                                  </div>
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => handleSmoothScroll(item.href)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 py-2"
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* WhatsApp Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <WhatsAppStatus />
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
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-2">
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      onClick={() => handleSmoothScroll(item.href)}
                      className="w-full justify-start space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50"
                    >
                      <Icon size={18} />
                      <div className="text-left">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </Button>
                  )
                })}
                
                {/* Mobile Tools Section */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 px-3 py-2">Tools & Services</p>
                  {toolsDropdown.map((tool) => {
                    const ToolIcon = tool.icon
                    return (
                      <Button
                        key={tool.name}
                        variant="ghost"
                        onClick={() => handleSmoothScroll(tool.href)}
                        className="w-full justify-start space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50"
                      >
                        <ToolIcon size={16} />
                        <div className="text-left">
                          <span className="font-medium">{tool.name}</span>
                          <p className="text-xs text-gray-600">{tool.description}</p>
                        </div>
                      </Button>
                    )
                  })}
                </div>

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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
