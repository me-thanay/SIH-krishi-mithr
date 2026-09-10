"use client"

import React from "react"
import { ExternalLink } from "lucide-react"

export function SimpleFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="text-sm text-gray-600">
            © 2024 Krishi Mithr Platform. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Developed by</span>
            <a
              href="https://www.linkedin.com/in/thanay-525924243/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-semibold transition-colors"
            >
              <span>P Thanay</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
