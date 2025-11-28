"use client"

import React, { useState, useEffect } from 'react'
import { User, Edit, Save, X, MapPin, Phone, Mail, Calendar, Crop, Award } from 'lucide-react'
import { NewNavbar } from '../src/components/ui/new-navbar'

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  agriculturalProfile?: {
    id: string
    farmSize: string
    crops: string[] | string
    location: string
    state: string
    district?: string
    soilType: string
    irrigationType: string
    farmingExperience: string
    annualIncome: string
    governmentSchemes: string[] | string
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  type AgriProfile = NonNullable<UserData['agriculturalProfile']>
  const [editedProfile, setEditedProfile] = useState<AgriProfile | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setEditedProfile(data.user.agriculturalProfile ?? null)
        }
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editedProfile) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agriculturalProfile: editedProfile
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(prev => prev ? { ...prev, agriculturalProfile: data.profile } : null)
          setIsEditing(false)
          alert('Profile updated successfully!')
        }
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setEditedProfile(user?.agriculturalProfile ?? null)
    setIsEditing(false)
  }

  const parseCrops = (crops: string[] | string) => {
    if (Array.isArray(crops)) return crops
    try {
      return JSON.parse(crops || '[]')
    } catch {
      return []
    }
  }

  const parseSchemes = (schemes: string[] | string) => {
    if (Array.isArray(schemes)) return schemes
    try {
      return JSON.parse(schemes || '[]')
    } catch {
      return []
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="w-8 h-8 text-green-500" />
                My Profile
              </h1>
              <p className="text-gray-600 mt-2">Manage your personal and agricultural information</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{user.name}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agricultural Profile */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agricultural Profile</h2>
              
              {user.agriculturalProfile ? (
                <div className="space-y-6">
                  {/* Farm Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.farmSize || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, farmSize: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.farmSize}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.location || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, location: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.state || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, state: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.soilType || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, soilType: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.soilType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Type</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.irrigationType || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, irrigationType: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.irrigationType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farming Experience</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.farmingExperience || ''}
                          onChange={(e) => setEditedProfile((prev: AgriProfile | null) => (prev ? { ...prev, farmingExperience: e.target.value } : prev))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.agriculturalProfile.farmingExperience}</p>
                      )}
                    </div>
                  </div>

                  {/* Crops */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Crops Grown</label>
                    <div className="flex flex-wrap gap-2">
                      {parseCrops(user.agriculturalProfile.crops).map((crop: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Government Schemes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Government Schemes</label>
                    <div className="flex flex-wrap gap-2">
                      {parseSchemes(user.agriculturalProfile.governmentSchemes).map((scheme: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {scheme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Crop className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Agricultural Profile</h3>
                  <p className="text-gray-600 mb-4">Complete your agricultural profile to get personalized recommendations.</p>
                  <button
                    onClick={() => window.location.href = '/auth/signup'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
