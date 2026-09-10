"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Camera, 
  Upload, 
  Leaf, 
  Droplets, 
  Thermometer,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Share2,
  MapPin,
  Calendar,
  TrendingUp,
  Shield,
  Sprout,
  Zap,
  Info
} from "lucide-react"
import { Card } from "./card"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface SoilAnalysisResult {
  analysis_id: string
  timestamp: string 
  location: string
  crop_type: string
  soil_type: string
  ph_level: number
  ph_status: string
  nutrients: {
    nitrogen: string
    phosphorus: string
    potassium: string
    organic_matter: string
    calcium: string
    magnesium: string
    sulfur: string
  }
  soil_health_score: number
  recommendations: Array<{
    category: string
    priority: string
    recommendation: string
    action: string
    timeline: string
  }>
  crop_suitability: Array<{
    crop_name: string
    suitability_score: number
    suitability_level: string
    reason: string
    planting_season: string
    expected_yield: string
  }>
  fertilizer_recommendations: Array<{
    type: string
    product: string
    application_rate: string
    timing: string
    method: string
    cost_estimate: string
  }>
  pest_prevention: Array<{
    category: string
    recommendation: string
    action: string
    benefit: string
  }>
  cultivation_methods: Array<{
    method: string
    description: string
    timing: string
    depth: string
    frequency: string
  }>
  irrigation_needs: {
    frequency: string
    amount: string
    method: string
    total_seasonal: string
  }
  image_processed: boolean
  confidence_score: number
}

interface SoilDetectionProps {
  className?: string
}

export const SoilDetection = ({ className }: SoilDetectionProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState("")
  const [cropType, setCropType] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "recommendations" | "crops" | "fertilizers" | "pest" | "cultivation">("overview")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const analyzeSoil = async () => {
    if (!selectedImage) {
      setError("Please select an image first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedImage)
      if (location) formData.append("location", location)
      if (cropType) formData.append("crop_type", cropType)

      let apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8000'
          : '')
      // Remove trailing slash to avoid double slashes
      apiBase = apiBase.replace(/\/+$/, '')

      const response = await fetch(`${apiBase}/api/soil/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to analyze soil")
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (err) {
      console.error("Soil analysis error:", err)
      setError("Failed to analyze soil. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAnalysisResult(null)
    setError(null)
    setLocation("")
    setCropType("")
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getNutrientColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
      case "excellent":
        return "text-green-600 bg-green-100"
      case "medium":
      case "good":
        return "text-yellow-600 bg-yellow-100"
      case "low":
      case "poor":
      case "fair":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Soil Analysis</h2>
          </div>
          <p className="text-gray-600">
            Upload a soil image to get comprehensive analysis and recommendations
          </p>
        </div>

        {/* Image Upload Section */}
        {!analysisResult && (
          <div className="space-y-4">
            {/* Image Preview */}
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Soil sample"
                  className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
                />
                <Button
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/90"
                >
                  ×
                </Button>
              </div>
            ) : (
              <div
                onClick={handleCameraCapture}
                className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
              >
                <Camera className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload soil image
                </p>
                <p className="text-sm text-gray-500">
                  Take a photo or select from gallery
                </p>
              </div>
            )}

            {/* Additional Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Punjab, India"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type (Optional)
                </label>
                <input
                  type="text"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  placeholder="e.g., Wheat, Rice, Tomatoes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={analyzeSoil}
                disabled={!selectedImage || loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze Soil
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analysis Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Analysis Complete
                  </h3>
                  <p className="text-sm text-gray-600">
                    Analysis ID: {analysisResult.analysis_id}
                  </p>
                </div>
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {[
                  { id: "overview", label: "Overview", icon: Info },
                  { id: "recommendations", label: "Recommendations", icon: CheckCircle },
                  { id: "crops", label: "Crop Suitability", icon: Sprout },
                  { id: "fertilizers", label: "Fertilizers", icon: Droplets },
                  { id: "pest", label: "Pest Prevention", icon: Shield },
                  { id: "cultivation", label: "Cultivation", icon: TrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Soil Health Score */}
                    <div className="text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold",
                        getHealthScoreBg(analysisResult.soil_health_score),
                        getHealthScoreColor(analysisResult.soil_health_score)
                      )}>
                        {analysisResult.soil_health_score}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Soil Health Score</p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Location:</span>
                          <span className="font-medium">{analysisResult.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Crop Type:</span>
                          <span className="font-medium">{analysisResult.crop_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Analyzed:</span>
                          <span className="font-medium">
                            {new Date(analysisResult.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Soil Type:</span>
                          <span className="font-medium">{analysisResult.soil_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">pH Level:</span>
                          <span className="font-medium">{analysisResult.ph_level} ({analysisResult.ph_status})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <span className="font-medium">{analysisResult.confidence_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Nutrients */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Nutrient Levels</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(analysisResult.nutrients).map(([nutrient, level]) => (
                          <div key={nutrient} className="text-center">
                            <div className={cn(
                              "px-3 py-2 rounded-lg text-sm font-medium",
                              getNutrientColor(level)
                            )}>
                              {level}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 capitalize">
                              {nutrient.replace('_', ' ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "recommendations" && (
                  <div className="space-y-4">
                    {analysisResult.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            getPriorityColor(rec.priority)
                          )}>
                            {rec.priority}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">
                              {rec.category}
                            </h5>
                            <p className="text-gray-700 mb-2">{rec.recommendation}</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Action:</strong> {rec.action}</p>
                              <p><strong>Timeline:</strong> {rec.timeline}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "crops" && (
                  <div className="space-y-4">
                    {analysisResult.crop_suitability.map((crop, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{crop.crop_name}</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{crop.suitability_score}%</span>
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              crop.suitability_level === "Excellent" ? "bg-green-100 text-green-600" :
                              crop.suitability_level === "Good" ? "bg-yellow-100 text-yellow-600" :
                              "bg-red-100 text-red-600"
                            )}>
                              {crop.suitability_level}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{crop.reason}</p>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p><strong>Planting Season:</strong> {crop.planting_season}</p>
                          <p><strong>Expected Yield:</strong> {crop.expected_yield}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "fertilizers" && (
                  <div className="space-y-4">
                    {analysisResult.fertilizer_recommendations.map((fertilizer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{fertilizer.type}</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Product:</strong> {fertilizer.product}</p>
                          <p><strong>Application Rate:</strong> {fertilizer.application_rate}</p>
                          <p><strong>Timing:</strong> {fertilizer.timing}</p>
                          <p><strong>Method:</strong> {fertilizer.method}</p>
                          <p><strong>Cost Estimate:</strong> {fertilizer.cost_estimate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "pest" && (
                  <div className="space-y-4">
                    {analysisResult.pest_prevention.map((prevention, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{prevention.category}</h5>
                        <p className="text-gray-700 mb-2">{prevention.recommendation}</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Action:</strong> {prevention.action}</p>
                          <p><strong>Benefit:</strong> {prevention.benefit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "cultivation" && (
                  <div className="space-y-4">
                    {analysisResult.cultivation_methods.map((method, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{method.method}</h5>
                        <p className="text-gray-700 mb-2">{method.description}</p>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p><strong>Timing:</strong> {method.timing}</p>
                          <p><strong>Depth:</strong> {method.depth}</p>
                          <p><strong>Frequency:</strong> {method.frequency}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Irrigation Needs */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h5 className="font-medium text-blue-900 mb-2">Irrigation Recommendations</h5>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-700">
                        <p><strong>Frequency:</strong> {analysisResult.irrigation_needs.frequency}</p>
                        <p><strong>Amount:</strong> {analysisResult.irrigation_needs.amount}</p>
                        <p><strong>Method:</strong> {analysisResult.irrigation_needs.method}</p>
                        <p><strong>Seasonal Total:</strong> {analysisResult.irrigation_needs.total_seasonal}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
