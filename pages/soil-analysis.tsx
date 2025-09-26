"use client"

import React, { useState } from 'react'
import { Upload, FileText, Camera, Download, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { NewNavbar } from '../src/components/ui/new-navbar'

export default function SoilAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setAnalysisResult(null)
    } else {
      alert('Please select a valid image file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const analyzeSoil = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    
    // Simulate analysis (replace with actual API call)
    setTimeout(() => {
      const mockResult = {
        pH: 6.8,
        nitrogen: 'Medium',
        phosphorus: 'High',
        potassium: 'Low',
        organicMatter: 'Good',
        moisture: 'Optimal',
        recommendations: [
          'Add potassium-rich fertilizer to improve soil fertility',
          'Consider adding organic compost to maintain soil structure',
          'Monitor pH levels regularly',
          'Suitable for most crops including rice, wheat, and vegetables'
        ],
        suitableCrops: ['Rice', 'Wheat', 'Tomato', 'Potato', 'Onion'],
        analysisDate: new Date().toISOString().split('T')[0]
      }
      setAnalysisResult(mockResult)
      setIsAnalyzing(false)
    }, 3000)
  }

  const downloadReport = () => {
    if (!analysisResult) return
    
    const reportData = {
      'Soil Analysis Report': analysisResult.analysisDate,
      'pH Level': analysisResult.pH,
      'Nitrogen': analysisResult.nitrogen,
      'Phosphorus': analysisResult.phosphorus,
      'Potassium': analysisResult.potassium,
      'Organic Matter': analysisResult.organicMatter,
      'Moisture': analysisResult.moisture,
      'Suitable Crops': analysisResult.suitableCrops.join(', '),
      'Recommendations': analysisResult.recommendations.join('\n')
    }

    const reportText = Object.entries(reportData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soil-analysis-report-${analysisResult.analysisDate}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getNutrientColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getNutrientIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-500" />
            Soil Analysis
          </h1>
          <p className="text-gray-600 mt-2">
            Upload a soil image to get detailed analysis and farming recommendations
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Soil Image</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-green-500 bg-green-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Camera className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your soil image here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, and other image formats
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={analyzeSoil}
                disabled={isAnalyzing}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing Soil...
                  </div>
                ) : (
                  'Analyze Soil'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{analysisResult.pH}</div>
                  <div className="text-sm text-gray-600">pH Level</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{analysisResult.moisture}</div>
                  <div className="text-sm text-gray-600">Moisture</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{analysisResult.organicMatter}</div>
                  <div className="text-sm text-gray-600">Organic Matter</div>
                </div>
              </div>

              <div className="text-sm text-gray-500 text-center">
                Analysis Date: {new Date(analysisResult.analysisDate).toLocaleDateString()}
              </div>
            </div>

            {/* Nutrient Levels */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrient Levels</h3>
              
              <div className="space-y-3">
                {[
                  { name: 'Nitrogen', level: analysisResult.nitrogen },
                  { name: 'Phosphorus', level: analysisResult.phosphorus },
                  { name: 'Potassium', level: analysisResult.potassium }
                ].map((nutrient) => (
                  <div key={nutrient.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{nutrient.name}</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getNutrientColor(nutrient.level)}`}>
                      {getNutrientIcon(nutrient.level)}
                      <span className="capitalize">{nutrient.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suitable Crops */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suitable Crops</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.suitableCrops.map((crop: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {crop}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Download Report */}
            <div className="text-center">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use Soil Analysis</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Take a clear photo of your soil sample in good lighting</li>
            <li>• Ensure the soil is visible and not covered by debris</li>
            <li>• Upload the image and wait for AI analysis</li>
            <li>• Review the detailed report and recommendations</li>
            <li>• Download the report for future reference</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
