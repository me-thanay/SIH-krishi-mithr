"use client"

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthModal } from '@/components/ui/auth-modal'
import { authAPI, tokenManager } from '@/lib/auth-client'

interface User {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
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

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  showAuthModal: (mode?: 'login' | 'signup') => void
  hideAuthModal: () => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const checkAuth = useCallback(async () => {
    const token = tokenManager.getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await authAPI.getProfile()
      if (response.success && response.user) {
        setUser(response.user)
        return
      }

      tokenManager.removeToken()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
      setUser(null)
    } catch {
      tokenManager.removeToken()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  const showAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  const hideAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const logout = useCallback(() => {
    tokenManager.removeToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthModalOpen,
    showAuthModal,
    hideAuthModal,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={hideAuthModal}
        defaultMode={authMode}
        onAuthSuccess={(nextUser) => {
          setUser(nextUser)
          setIsLoading(false)
          hideAuthModal()
        }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
