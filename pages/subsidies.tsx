"use client"

import React, { useState, useEffect } from "react"
import { 
  Award, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ExternalLink
} from "lucide-react"
import { NewNavbar } from "../src/components/ui/new-navbar"

interface Subsidy {
  id: string
  name: string
  description: string
  eligibility: string
  amount: string
  category: string
  state?: string
  district?: string | null
  cropType?: string | null
  minFarmSize?: string
  maxFarmSize?: string | null
  validFrom?: string
  validTo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SubsidiesPage() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([])
  const [userSubsidies, setUserSubsidies] = useState<Subsidy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'personalized'>('personalized')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Load personalized subsidies (using mock data for now)
        const personalizedSubsidies = getMockSubsidies().filter(subsidy => 
          isEligible(subsidy)
        )
        setUserSubsidies(personalizedSubsidies)
      }
      
      // Load all subsidies (using mock data)
      const allSubsidies = getMockSubsidies()
      setSubsidies(allSubsidies)
    } catch (error) {
      console.error('Error loading subsidies:', error)
      // Fallback to mock data
      const mockSubsidies = getMockSubsidies()
      setSubsidies(mockSubsidies)
      setUserSubsidies(mockSubsidies.slice(0, 3)) // Show first 3 as personalized
    } finally {
      setIsLoading(false)
    }
  }

  const getMockSubsidies = (): Subsidy[] => {
    return [
      {
        id: '1',
        name: 'PM-KISAN Scheme',
        description: 'Direct income support to farmers for agricultural expenses',
        eligibility: '{"criteria": ["Landholding farmers", "Small and marginal farmers"], "documents": ["Land records", "Bank account details"]}',
        amount: '₹6,000/year',
        category: 'Income Support',
        state: 'All States',
        district: null,
        cropType: null,
        minFarmSize: '0.1 acres',
        maxFarmSize: '2 acres',
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Soil Health Card Scheme',
        description: 'Free soil testing and recommendations for farmers',
        eligibility: '{"criteria": ["Farmers with agricultural land"], "documents": ["Land ownership proof"]}',
        amount: 'Free',
        category: 'Soil Health',
        state: 'All States',
        district: null,
        cropType: null,
        minFarmSize: '0.1 acres',
        maxFarmSize: null,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Pradhan Mantri Fasal Bima Yojana',
        description: 'Crop insurance scheme for farmers against crop loss',
        eligibility: '{"criteria": ["Farmers growing notified crops"], "documents": ["Land records", "Crop details"]}',
        amount: 'Premium: 1.5-2% of sum insured',
        category: 'Crop Insurance',
        state: 'All States',
        district: null,
        cropType: 'Rice',
        minFarmSize: '0.1 acres',
        maxFarmSize: null,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'Kisan Credit Card',
        description: 'Credit facility for farmers for agricultural needs',
        eligibility: '{"criteria": ["Farmers", "Agricultural laborers"], "documents": ["Land records", "Income proof"]}',
        amount: 'Up to ₹3 lakh',
        category: 'Credit',
        state: 'All States',
        district: null,
        cropType: null,
        minFarmSize: '0.1 acres',
        maxFarmSize: null,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '5',
        name: 'Maharashtra State Agricultural Subsidy',
        description: 'State-specific subsidy for Maharashtra farmers',
        eligibility: '{"criteria": ["Maharashtra residents", "Agricultural land owners"], "documents": ["State residence proof", "Land records"]}',
        amount: '₹10,000/year',
        category: 'State Support',
        state: 'Maharashtra',
        district: null,
        cropType: 'Wheat',
        minFarmSize: '0.5 acres',
        maxFarmSize: '5 acres',
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '6',
        name: 'Organic Farming Promotion',
        description: 'Support for farmers transitioning to organic farming',
        eligibility: '{"criteria": ["Farmers willing to adopt organic farming"], "documents": ["Land records", "Organic farming plan"]}',
        amount: '₹25,000/hectare',
        category: 'Organic Farming',
        state: 'All States',
        district: null,
        cropType: 'Vegetables',
        minFarmSize: '0.5 acres',
        maxFarmSize: '10 acres',
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  }

  const parseEligibility = (eligibility: string) => {
    try {
      return JSON.parse(eligibility)
    } catch {
      return { criteria: [eligibility], documents: [] }
    }
  }

  const isEligible = (subsidy: Subsidy) => {
    if (!user?.agriculturalProfile) {
      // If no profile, show all national subsidies
      return subsidy.state === 'All States' || !subsidy.state
    }
    
    const profile = user.agriculturalProfile
    
    // Check farm size
    if (subsidy.minFarmSize && subsidy.maxFarmSize) {
      const farmSize = parseFloat(profile.farmSize?.split(' ')[0] || '0')
      const minSize = parseFloat(subsidy.minFarmSize.split(' ')[0])
      const maxSize = parseFloat(subsidy.maxFarmSize.split(' ')[0])
      
      if (farmSize < minSize || farmSize > maxSize) {
        return false
      }
    }
    
    // Check state
    if (subsidy.state && subsidy.state !== 'All States' && subsidy.state !== profile.state) {
      return false
    }
    
    // Check crop type
    if (subsidy.cropType) {
      const crops = Array.isArray(profile.crops) 
        ? profile.crops 
        : JSON.parse(profile.crops || '[]')
      
      if (!crops.includes(subsidy.cropType)) {
        return false
      }
    }
    
    return true
  }

  const renderSubsidyCard = (subsidy: Subsidy, isPersonalized: boolean = false) => {
    const eligibility = parseEligibility(subsidy.eligibility)
    const eligible = isPersonalized || isEligible(subsidy)
    
    return (
      <div key={subsidy.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subsidy.name}</h3>
              <p className="text-sm text-gray-600">{subsidy.category}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">{subsidy.amount}</p>
            <div className="flex items-center gap-1 mt-1">
              {eligible ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-xs font-medium ${
                eligible ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {eligible ? 'Eligible' : 'Check Eligibility'}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{subsidy.description}</p>
        
        <div className="space-y-2 mb-4">
          <h4 className="font-medium text-gray-900">Eligibility Criteria:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {eligibility.criteria?.map((criterion: string, index: number) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {subsidy.state && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <MapPin className="w-3 h-3 inline mr-1" />
              {subsidy.state}
            </span>
          )}
          {subsidy.cropType && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {subsidy.cropType}
            </span>
          )}
          {subsidy.minFarmSize && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Min: {subsidy.minFarmSize}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {subsidy.validFrom && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Valid: {new Date(subsidy.validFrom).toLocaleDateString()}
              </div>
            )}
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            Apply Now
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subsidies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Award className="w-8 h-8 text-green-600" />
            Government Subsidies
          </h1>
          <p className="text-gray-600">
            Find subsidies tailored to your farming needs
          </p>
          {user && (
            <div className="mt-4 text-sm text-gray-600">
              Welcome, {user.name} • {user.agriculturalProfile?.farmSize} • {user.agriculturalProfile?.state}
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'personalized' ? (
          <div>
            {user ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Subsidies for Your Profile
                  </h2>
                  <p className="text-gray-600">
                    Based on your {user.agriculturalProfile?.farmSize} farm in {user.agriculturalProfile?.state}
                  </p>
                </div>
                
                {userSubsidies.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userSubsidies.map(subsidy => renderSubsidyCard(subsidy, true))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Personalized Subsidies</h3>
                    <p className="text-gray-600 mb-4">
                      We couldn't find subsidies specifically tailored to your profile.
                    </p>
                    <button
                      onClick={() => setActiveTab('all')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      View All Subsidies
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Please Sign In</h3>
                <p className="text-gray-600 mb-4">
                  Sign in to see personalized subsidies based on your agricultural profile.
                </p>
                <button
                  onClick={() => window.location.href = '/auth/login'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                All Available Subsidies
              </h2>
              <p className="text-gray-600">
                Browse all government subsidies and schemes available for farmers
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subsidies.map(subsidy => renderSubsidyCard(subsidy))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex space-x-8 justify-center">
              <button
                onClick={() => setActiveTab('personalized')}
                className={`py-2 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === 'personalized'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Personalized Subsidies ({userSubsidies.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === 'all'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Subsidies ({subsidies.length})
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
