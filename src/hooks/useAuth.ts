import { useState, useEffect, useCallback } from 'react'
import { authAPI, tokenManager, authUtils, User, AgriculturalProfile, UserCrop } from '@/lib/auth-client'
import { InfinityIcon } from 'lucide-react'

interface AuthState {
  user: (User & {
    agriculturalProfile?: AgriculturalProfile
    userCrops?: UserCrop[]
    weatherQueries?: any[]
    marketQueries?: any[]
  }) | null
  agriculturalProfile: AgriculturalProfile | null
  userCrops: UserCrop[]
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (profileData: any) => Promise<boolean>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    agriculturalProfile: null,
    userCrops: [],
    isLoading: false,
    isAuthenticated: true,
    error: null
  })

  // Initialize auth state on mount
  useEffect(() => {
    // Auth disabled: mark as authenticated immediately
    setState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }))
  }, [])

  const initializeAuth = async () => {
    // Auth disabled: no-op
    setState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }))
  }

  const login = useCallback(async (_email: string, _password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isAuthenticated: true, isLoading: false, error: null }))
    return true
  }, [])

  const signup = useCallback(async (_userData: any): Promise<boolean> => {
    setState(prev => ({ ...prev, isAuthenticated: true, isLoading: false, error: null }))
    return true
  }, [])

  const logout = useCallback(() => {
    setState({
      user: null,
      agriculturalProfile: null,
      userCrops: [],
      isLoading: false,
      isAuthenticated: true,
      error: null
    })
  }, [])

  const updateProfile = useCallback(async (profileData: any): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await authAPI.updateProfile(profileData)
      
      if (response.success) {
        // Refresh profile to get updated data
        await refreshProfile()
        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Profile update failed',
          isLoading: false
        }))
        return false
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setState(prev => ({
        ...prev,
        error: 'Profile update failed. Please try again.',
        isLoading: false
      }))
      return false
    }
  }, [])

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await authAPI.getProfile()
      if (response.success && response.user) {
        setState(prev => ({
          ...prev,
          user: response.user!,
          agriculturalProfile: response.user!.agriculturalProfile || null,
          userCrops: response.user!.userCrops || [],
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Profile refresh error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    refreshProfile,
    clearError
  }
}

// Hook for managing user crops
export function useUserCrops() {
  const { userCrops, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCrop = async (cropData: {
    cropId: string
    plantedDate?: string
    quantity?: number
    notes?: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { cropAPI } = await import('@/lib/auth-client')
      const response = await cropAPI.addUserCrop(cropData)
      
      if (response.success) {
        await refreshProfile()
        return true
      } else {
        setError('Failed to add crop')
        return false
      }
    } catch (error) {
      console.error('Add crop error:', error)
      setError('Failed to add crop. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateCrop = async (id: string, cropData: {
    plantedDate?: string
    harvestDate?: string
    quantity?: number
    status?: string
    notes?: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { cropAPI } = await import('@/lib/auth-client')
      const response = await cropAPI.updateUserCrop(id, cropData)
      
      if (response.success) {
        await refreshProfile()
        return true
      } else {
        setError('Failed to update crop')
        return false
      }
    } catch (error) {
      console.error('Update crop error:', error)
      setError('Failed to update crop. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeCrop = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { cropAPI } = await import('@/lib/auth-client')
      const response = await cropAPI.removeUserCrop(id)
      
      if (response.success) {
        await refreshProfile()
        return true
      } else {
        setError('Failed to remove crop')
        return false
      }
    } catch (error) {
      console.error('Remove crop error:', error)
      setError('Failed to remove crop. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    userCrops,
    isLoading,
    error,
    addCrop,
    updateCrop,
    removeCrop,
    clearError: () => setError(null)
  }
}
