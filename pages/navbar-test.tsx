import React from 'react'
import { AgriNavBarDemo } from '@/components/ui/agri-navbar-demo'

export default function NavbarTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Navbar Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Where to Find the Navbar:</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🖥️ Desktop (Wide Screen):</h3>
              <p className="text-blue-700">Look at the <strong>TOP CENTER</strong> of the page</p>
              <p className="text-sm text-blue-600">The navbar should appear as a white rounded pill with text labels</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📱 Mobile (Narrow Screen):</h3>
              <p className="text-green-700">Look at the <strong>BOTTOM CENTER</strong> of the page</p>
              <p className="text-sm text-green-600">The navbar should appear as a white rounded pill with icons</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Navbar Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>Home</strong> - Main dashboard</li>
            <li>• <strong>Pest Detection</strong> - AI pest identification</li>
            <li>• <strong>Soil Analysis</strong> - Soil health assessment</li>
            <li>• <strong>Market Prices</strong> - Commodity prices</li>
            <li>• <strong>Dealers</strong> - Supplier network</li>
            <li>• <strong>Tools</strong> - Equipment marketplace</li>
            <li>• <strong>Chat</strong> - Voice assistant</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ If you can't see the navbar:</h3>
          <ol className="space-y-2 text-yellow-700">
            <li>1. Try resizing your browser window (make it narrower/wider)</li>
            <li>2. Scroll to the very top or bottom of the page</li>
            <li>3. Check if you have any browser extensions blocking elements</li>
            <li>4. Try refreshing the page (Ctrl+F5)</li>
          </ol>
        </div>

        {/* Add some content to push the navbar into view */}
        <div className="h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
          Scroll up to see the navbar at the top!
        </div>
        
        <div className="h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold mt-8">
          Scroll down to see the navbar at the bottom!
        </div>
      </div>
    </div>
  )
}
