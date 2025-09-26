// Client-side authentication utilities for frontend components

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface AgriculturalProfile {
  id: string
  userId: string
  farmSize: string
  crops: string[]
  location: string
  state: string
  district?: string
  soilType: string
  irrigationType: string
  farmingExperience: string
  annualIncome: string
  governmentSchemes: string[]
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
  error?: string
}

export interface Crop {
  id: string
  name: string
  scientificName?: string
  category: string
  season: string
  duration: number
  waterRequirement: string
  soilType: string
  climate: string
  yieldPerAcre?: string
  marketPrice?: number
  description?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCrop {
  id: string
  userId: string
  cropId: string
  plantedDate?: string
  harvestDate?: string
  quantity?: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  crop: Crop
}

export interface Subsidy {
  id: string
  name: string
  description: string
  eligibility: string
  amount: string
  category: string
  state?: string
  district?: string
  cropType?: string
  minFarmSize?: string
  maxFarmSize?: string
  validFrom?: string
  validTo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  },

  getAuthHeaders: (): HeadersInit => {
    const token = tokenManager.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...tokenManager.getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Authentication functions
export const authAPI = {
  // Sign up new user
  signup: async (userData: {
    email: string
    password: string
    name: string
    phone?: string
    agriculturalProfile: {
      farmSize: string
      crops: string[]
      location: string
      state: string
      district?: string
      soilType: string
      irrigationType: string
      farmingExperience: string
      annualIncome: string
      governmentSchemes: string[]
    }
  }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Store token if login successful
    if (response.success && response.token) {
      tokenManager.setToken(response.token)
    }

    return response
  },

  // Logout user
  logout: (): void => {
    tokenManager.removeToken()
  },

  // Get user profile
  getProfile: async (): Promise<{
    success: boolean
    user?: User & {
      agriculturalProfile?: AgriculturalProfile
      userCrops?: UserCrop[]
      weatherQueries?: any[]
      marketQueries?: any[]
    }
    error?: string
  }> => {
    return apiRequest('/api/auth/profile')
  },

  // Update user profile
  updateProfile: async (profileData: {
    name?: string
    phone?: string
    agriculturalProfile?: Partial<AgriculturalProfile>
  }): Promise<AuthResponse> => {
    return apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }
}

// Crop management functions
export const cropAPI = {
  // Get all crops
  getCrops: async (params?: {
    category?: string
    season?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{
    success: boolean
    data: Crop[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/crops?${queryString}` : '/api/crops'
    
    return apiRequest(endpoint)
  },

  // Get specific crop
  getCrop: async (id: string): Promise<{
    success: boolean
    data: Crop
  }> => {
    return apiRequest(`/api/crops/${id}`)
  },

  // Get user's crops
  getUserCrops: async (status?: string): Promise<{
    success: boolean
    data: UserCrop[]
  }> => {
    const queryParams = status ? `?status=${status}` : ''
    return apiRequest(`/api/user/crops${queryParams}`)
  },

  // Add crop to user's farm
  addUserCrop: async (cropData: {
    cropId: string
    plantedDate?: string
    quantity?: number
    notes?: string
  }): Promise<{
    success: boolean
    data: UserCrop
    message: string
  }> => {
    return apiRequest('/api/user/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    })
  },

  // Update user crop
  updateUserCrop: async (id: string, cropData: {
    plantedDate?: string
    harvestDate?: string
    quantity?: number
    status?: string
    notes?: string
  }): Promise<{
    success: boolean
    data: UserCrop
    message: string
  }> => {
    return apiRequest(`/api/user/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    })
  },

  // Remove user crop
  removeUserCrop: async (id: string): Promise<{
    success: boolean
    message: string
  }> => {
    return apiRequest(`/api/user/crops/${id}`, {
      method: 'DELETE',
    })
  }
}

// Subsidy management functions
export const subsidyAPI = {
  // Get all subsidies
  getSubsidies: async (params?: {
    category?: string
    state?: string
    district?: string
    cropType?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{
    success: boolean
    data: Subsidy[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/subsidies?${queryString}` : '/api/subsidies'
    
    return apiRequest(endpoint)
  },

  // Get user-specific subsidies
  getUserSubsidies: async (): Promise<{
    success: boolean
    data: Subsidy[]
    message: string
  }> => {
    return apiRequest('/api/user/subsidies')
  }
}

// Utility functions
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken()
  },

  // Get current user from token (basic info only)
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await authAPI.getProfile()
      return response.success && response.user ? response.user : null
    } catch (error) {
      return null
    }
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  // Format currency for display
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
}
