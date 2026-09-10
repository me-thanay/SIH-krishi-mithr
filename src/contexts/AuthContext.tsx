"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

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
  // Always authenticated - no auth required
  const [user] = useState<User | null>({
    id: 'guest',
    name: 'Guest User',
    email: 'guest@krishimithr.com',
    phone: '',
    createdAt: new Date().toISOString(),
    agriculturalProfile: undefined
  })
  const [isLoading] = useState(false)

  const showAuthModal = () => {
    // No-op - auth disabled
  }

  const hideAuthModal = () => {
    // No-op - auth disabled
  }

  const logout = () => {
    // No-op - auth disabled
  }

  const checkAuth = async () => {
    // No-op - auth disabled
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: true, // Always authenticated
    isAuthModalOpen: false, // Never show modal
    showAuthModal,
    hideAuthModal,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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
