import React from 'react'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex space-x-4">
          <Link
            href="/"
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          
          <Link
            href="/auth/signup"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Popular pages:</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="/auth/login" className="text-green-600 hover:underline">
              Login
            </Link>
            <Link href="/dashboard" className="text-green-600 hover:underline">
              Dashboard
            </Link>
            <Link href="/auth/signup" className="text-green-600 hover:underline">
              Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
