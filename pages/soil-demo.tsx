import React from 'react'
import { Leaf, Droplets, Thermometer, Zap } from 'lucide-react'

export default function SoilAnalysisDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Soil Analysis</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive soil health assessment and nutrient recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Soil Test Results</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Droplets className="w-6 h-6 text-blue-600 mr-3" />
                  <span className="font-semibold text-blue-800">Moisture Level</span>
                </div>
                <span className="text-blue-600 font-bold">65%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <Thermometer className="w-6 h-6 text-red-600 mr-3" />
                  <span className="font-semibold text-red-800">pH Level</span>
                </div>
                <span className="text-red-600 font-bold">6.8</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Zap className="w-6 h-6 text-green-600 mr-3" />
                  <span className="font-semibold text-green-800">Organic Matter</span>
                </div>
                <span className="text-green-600 font-bold">4.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Nutrient Levels</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nitrogen (N)</span>
                  <span className="font-semibold">Medium</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Phosphorus (P)</span>
                  <span className="font-semibold">High</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Potassium (K)</span>
                  <span className="font-semibold">Low</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '30%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recommendations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Fertilizer Suggestions</h3>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Potassium Sulfate:</strong> 50kg per acre to improve K levels
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Urea:</strong> 25kg per acre for nitrogen boost
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Soil Improvement</h3>
              <div className="p-4 bg-brown-50 rounded-lg">
                <p className="text-sm text-brown-800">
                  <strong>Compost:</strong> Add 2-3 tons per acre for organic matter
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Cover Crops:</strong> Plant legumes to fix nitrogen naturally
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
