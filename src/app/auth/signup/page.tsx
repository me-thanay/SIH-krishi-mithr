"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sprout, MapPin, Calendar, Droplets } from "lucide-react"

interface AgriculturalProfile {
  farmSize: string
  crops: string[]
  location: string
  soilType: string
  irrigationType: string
  farmingExperience: string
  annualIncome: string
  governmentSchemes: string[]
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  })
  const [agriculturalProfile, setAgriculturalProfile] = useState<AgriculturalProfile>({
    farmSize: "",
    crops: [],
    location: "",
    soilType: "",
    irrigationType: "",
    farmingExperience: "",
    annualIncome: "",
    governmentSchemes: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const cropOptions = [
    "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut", 
    "Mustard", "Potato", "Onion", "Tomato", "Chili", "Mango", "Banana", "Coconut"
  ]

  const soilTypes = [
    "Clay", "Sandy", "Loamy", "Silty", "Red Soil", "Black Soil", "Alluvial"
  ]

  const irrigationTypes = [
    "Rainfed", "Tube Well", "Canal", "Drip Irrigation", "Sprinkler", "Flood Irrigation"
  ]

  const governmentSchemes = [
    "PM-KISAN", "Soil Health Card", "Pradhan Mantri Fasal Bima Yojana", 
    "National Mission for Sustainable Agriculture", "Rashtriya Krishi Vikas Yojana"
  ]

  const handleBasicInfo = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleAgriculturalProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(3)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Simulate signup API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Store user data
      const userData = {
        ...formData,
        agriculturalProfile,
        createdAt: new Date().toISOString()
      }
      localStorage.setItem('user', JSON.stringify(userData))
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCrop = (crop: string) => {
    setAgriculturalProfile(prev => ({
      ...prev,
      crops: prev.crops.includes(crop) 
        ? prev.crops.filter(c => c !== crop)
        : [...prev.crops, crop]
    }))
  }

  const toggleScheme = (scheme: string) => {
    setAgriculturalProfile(prev => ({
      ...prev,
      governmentSchemes: prev.governmentSchemes.includes(scheme)
        ? prev.governmentSchemes.filter(s => s !== scheme)
        : [...prev.governmentSchemes, scheme]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? "Create Account" : step === 2 ? "Agricultural Profile" : "Complete Setup"}
          </h1>
          <p className="text-gray-600">
            {step === 1 ? "Join Krishi Mithr" : step === 2 ? "Tell us about your farm" : "Review your information"}
          </p>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleBasicInfo} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Create a password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue to Agricultural Profile
            </button>
          </form>
        )}

        {/* Step 2: Agricultural Profile */}
        {step === 2 && (
          <form onSubmit={handleAgriculturalProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Farm Size (Acres)
                </label>
                <select
                  value={agriculturalProfile.farmSize}
                  onChange={(e) => setAgriculturalProfile({ ...agriculturalProfile, farmSize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select farm size</option>
                  <option value="0-1">0-1 acres</option>
                  <option value="1-5">1-5 acres</option>
                  <option value="5-10">5-10 acres</option>
                  <option value="10-25">10-25 acres</option>
                  <option value="25-50">25-50 acres</option>
                  <option value="50+">50+ acres</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Farming Experience
                </label>
                <select
                  value={agriculturalProfile.farmingExperience}
                  onChange={(e) => setAgriculturalProfile({ ...agriculturalProfile, farmingExperience: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select experience</option>
                  <option value="0-2">0-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10-20">10-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location (State/District)
              </label>
              <input
                type="text"
                value={agriculturalProfile.location}
                onChange={(e) => setAgriculturalProfile({ ...agriculturalProfile, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Telangana, Hyderabad"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crops You Cultivate (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {cropOptions.map(crop => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={`p-2 rounded-lg text-sm border transition-colors ${
                      agriculturalProfile.crops.includes(crop)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soil Type
                </label>
                <select
                  value={agriculturalProfile.soilType}
                  onChange={(e) => setAgriculturalProfile({ ...agriculturalProfile, soilType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select soil type</option>
                  {soilTypes.map(soil => (
                    <option key={soil} value={soil}>{soil}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="inline w-4 h-4 mr-1" />
                  Irrigation Type
                </label>
                <select
                  value={agriculturalProfile.irrigationType}
                  onChange={(e) => setAgriculturalProfile({ ...agriculturalProfile, irrigationType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select irrigation type</option>
                  {irrigationTypes.map(irrigation => (
                    <option key={irrigation} value={irrigation}>{irrigation}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Government Schemes (Select all that apply)
              </label>
              <div className="space-y-2">
                {governmentSchemes.map(scheme => (
                  <button
                    key={scheme}
                    type="button"
                    onClick={() => toggleScheme(scheme)}
                    className={`w-full p-3 rounded-lg text-left border transition-colors ${
                      agriculturalProfile.governmentSchemes.includes(scheme)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {scheme}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Continue to Review
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Review and Complete */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
              
              <div>
                <h4 className="font-medium text-gray-700">Personal Information</h4>
                <p className="text-gray-600">Name: {formData.name}</p>
                <p className="text-gray-600">Email: {formData.email}</p>
                <p className="text-gray-600">Phone: {formData.phone}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Agricultural Profile</h4>
                <p className="text-gray-600">Farm Size: {agriculturalProfile.farmSize} acres</p>
                <p className="text-gray-600">Location: {agriculturalProfile.location}</p>
                <p className="text-gray-600">Crops: {agriculturalProfile.crops.join(', ')}</p>
                <p className="text-gray-600">Soil Type: {agriculturalProfile.soilType}</p>
                <p className="text-gray-600">Irrigation: {agriculturalProfile.irrigationType}</p>
                <p className="text-gray-600">Experience: {agriculturalProfile.farmingExperience}</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Complete Signup"}
              </button>
            </div>
          </form>
        )}

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
