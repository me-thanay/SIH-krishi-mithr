"use client"

import React from 'react'
import { TubelightNavBarDemo, TubelightNavBarCompact } from '../src/components/ui/tubelight-navbar-demo'
import { Home, BarChart3, Award, User, Cloud, TrendingUp, Leaf, MessageCircle, Sprout } from 'lucide-react'

export default function TubelightNavbarDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Demo Navigation */}
      <TubelightNavBarDemo />
      
      {/* Content */}
      <div className="pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🌱 Tubelight Navigation Demo
            </h1>
            <p className="text-xl text-gray-600">
              Experience the beautiful tubelight navigation bar for Krishi Mithr
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sprout className="w-6 h-6 text-green-600" />
                Full Navigation
              </h3>
              <p className="text-gray-600 mb-4">
                Complete navigation with all Krishi Mithr features including Home, Dashboard, Subsidies, Weather, Market Prices, Soil Analysis, Profile, and Support.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <TubelightNavBarDemo />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-green-600" />
                Compact Navigation
              </h3>
              <p className="text-gray-600 mb-4">
                Streamlined navigation with essential features for better mobile experience.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <TubelightNavBarCompact />
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Tubelight Navigation Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Responsive Design</h4>
                    <p className="text-gray-600 text-sm">Adapts to mobile and desktop screens</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Smooth Animations</h4>
                    <p className="text-gray-600 text-sm">Framer Motion powered transitions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Active State</h4>
                    <p className="text-gray-600 text-sm">Visual feedback with tubelight effect</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Glass Morphism</h4>
                    <p className="text-gray-600 text-sm">Modern backdrop blur effect</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Icon Support</h4>
                    <p className="text-gray-600 text-sm">Lucide React icons for mobile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Accessibility</h4>
                    <p className="text-gray-600 text-sm">Keyboard navigation support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 How to Use</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">1. Import the Component</h3>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  import {`{TubelightNavBarDemo}`} from '../src/components/ui/tubelight-navbar-demo'
                </code>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">2. Add to Your Page</h3>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  &lt;TubelightNavBarDemo /&gt;
                </code>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">3. Customize Navigation Items</h3>
                <p className="text-gray-600 text-sm">Edit the navItems array in tubelight-navbar-demo.tsx to customize the navigation links.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
