import React from 'react'
import { Bug, Camera, Upload } from 'lucide-react'

export default function PestDetectionDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Bug className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pest Detection</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered pest identification and management recommendations for your crops
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upload Plant Image</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Detection Results</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <Bug className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="font-semibold text-red-800">Aphids Detected</p>
                  <p className="text-sm text-red-600">Confidence: 95%</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <Bug className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <p className="font-semibold text-yellow-800">Leaf Miner</p>
                  <p className="text-sm text-yellow-600">Confidence: 87%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Treatment Recommendations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Organic Solution</h3>
              <p className="text-sm text-green-700">Neem oil spray every 7 days for 3 weeks</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Chemical Treatment</h3>
              <p className="text-sm text-blue-700">Pyrethrin-based insecticide as per label instructions</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Prevention</h3>
              <p className="text-sm text-purple-700">Introduce beneficial insects like ladybugs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
