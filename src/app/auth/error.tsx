"use client"

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-6">
          Something went wrong with the authentication process. Please try again.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700 font-mono">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={reset}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Need help? Contact our support team:</p>
          <a 
            href="https://wa.me/7670997498?text=Hello! I need help with authentication."
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  )
}
