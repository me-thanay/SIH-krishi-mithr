"use client"

import React from "react"
import { motion } from "framer-motion"
import { ExternalLink, Heart } from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-green-50 to-blue-50 border-t border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="text-green-600 text-2xl font-bold"
            >
              🌱
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Smart AgriTech</h3>
              <p className="text-sm text-gray-600">Empowering Farmers with AI</p>
            </div>
          </div>

          {/* Center - Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 Smart AgriTech Platform. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Built with ❤️ for the farming community
            </p>
          </div>

          {/* Right side - Developer Info */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex items-center space-x-2"
          >
            <span className="text-sm text-gray-600">Developed by</span>
            <a
              href="https://www.linkedin.com/in/thanay-525924243/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors duration-300 shadow-md hover:shadow-lg"
            >
              <span className="font-semibold">P Thanay</span>
              <ExternalLink size={16} />
            </a>
          </motion.div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>🌾 Agriculture</span>
              <span>🤖 AI-Powered</span>
              <span>📱 Mobile-First</span>
              <span>🌍 Sustainable</span>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Heart size={14} className="text-red-500" />
              <span>Made with passion for farmers</span>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
