"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthModal } from '@/components/ui/auth-modal'

interface User {
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
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        } else {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
        }
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Auto-show modal for non-authenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setAuthModalOpen(true)
        setAuthModalMode('login')
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isLoading, user])

  const showAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const hideAuthModal = () => {
    setAuthModalOpen(false)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    hideAuthModal()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthModalOpen: authModalOpen,
    showAuthModal,
    hideAuthModal,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
        <AuthModal
          isOpen={authModalOpen}
          onClose={hideAuthModal}
          defaultMode={authModalMode}
          onAuthSuccess={handleAuthSuccess}
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
