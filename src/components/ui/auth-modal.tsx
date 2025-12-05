"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, MapPin, Calendar, Droplets, Eye, EyeOff, Sprout, Camera, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
  onAuthSuccess?: (user: any) => void
}

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

export function AuthModal({ isOpen, onClose, defaultMode = 'login', onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')

  // Login form state
  const [loginMethod, setLoginMethod] = useState<'face' | 'phone'>('face')
  const [loginData, setLoginData] = useState({
    phone: ''
  })
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [signupFaceRequired] = useState(true) // require face capture on signup

  const [agriculturalProfile, setAgriculturalProfile] = useState<AgriculturalProfile>({
    farmSize: '',
    crops: [],
    location: '',
    soilType: '',
    irrigationType: '',
    farmingExperience: '',
    annualIncome: '',
    governmentSchemes: []
  })

  // Start camera for face detection (with fallback constraints)
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported in this browser/environment.')
      return
    }

    setCameraError(null)
    setIsCapturing(true)

    const tryStart = async (constraints: MediaStreamConstraints) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        
        if (videoRef.current) {
          // Set srcObject first
          videoRef.current.srcObject = stream
          
          // Wait for video metadata to load
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('Video element not found'))
              return
            }
            
            const video = videoRef.current
            
            const handleLoadedMetadata = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata)
              resolve()
            }
            
            const handleError = (e: Event) => {
              video.removeEventListener('error', handleError)
              reject(new Error('Video load error'))
            }
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
            video.addEventListener('error', handleError)
            
            // Force play
            video.play()
              .then(() => {
                video.removeEventListener('error', handleError)
                resolve()
              })
              .catch((err) => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata)
                video.removeEventListener('error', handleError)
                console.warn('Video play error:', err)
                // Still resolve if metadata loaded, video might still work
                if (video.readyState >= 2) {
                  resolve()
                } else {
                  reject(err)
                }
              })
          })
          
          setCameraError(null)
        }
      } catch (err) {
        throw err
      }
    }

    try {
      // First try front camera with ideal resolution
      await tryStart({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      })
    } catch (err) {
      console.warn('Front camera failed, retrying with fallback constraints', err)
      try {
        // Fallback: any camera
        await tryStart({ video: true })
      } catch (err2) {
        console.error('Camera error:', err2)
        setIsCapturing(false)
        setCameraError('Unable to access camera. Please allow camera permission and try again.')
      }
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }

  // Capture face photo
  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setFaceImage(imageData)
      stopCamera()
    }
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Auto-start camera when entering signup step 2 (face required)
  useEffect(() => {
    if (mode === 'signup' && currentStep === 2 && !faceImage && !isCapturing) {
      startCamera()
    }
  }, [mode, currentStep, faceImage, isCapturing])

  // Auto-start camera when face login method is selected
  useEffect(() => {
    if (mode === 'login' && loginMethod === 'face' && !faceImage && !isCapturing && !cameraError) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startCamera()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [mode, loginMethod, faceImage, isCapturing, cameraError])

  const handleClose = () => {
    setError('')
    setCurrentStep(1)
    setMode(defaultMode)
    setFaceImage(null)
    stopCamera()
    onClose()
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!loginData.phone) {
      setError('Please enter your phone number')
      setIsLoading(false)
      return
    }

    if (!validatePhone(loginData.phone)) {
      setError('Please enter a valid 10-digit phone number')
      setIsLoading(false)
      return
    }

    try {
      let requestBody: any = {
        phone: loginData.phone,
        loginMethod: loginMethod
      }

      if (loginMethod === 'face') {
        if (!faceImage) {
          setError('Please capture your face for verification')
          setIsLoading(false)
          return
        }
        requestBody.faceImage = faceImage
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        setError('Server error: Invalid response. Please check your environment variables.')
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || `Server error (${response.status})`
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      if (data.success) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onAuthSuccess?.(data.user)
        handleClose()
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (signupFaceRequired && !faceImage) {
      setError('Please capture your face to complete signup')
      return
    }

    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Parse location into state and district
      const locationParts = agriculturalProfile.location.split(',')
      const state = locationParts[0]?.trim() || ''
      const district = locationParts[1]?.trim() || ''

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          faceImage: faceImage,
          agriculturalProfile: {
            ...agriculturalProfile,
            state,
            district
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onAuthSuccess?.(data.user)
        handleClose()
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setCurrentStep(1)
  }

  const updateAgriculturalProfile = (field: keyof AgriculturalProfile, value: any) => {
    setAgriculturalProfile(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: 'crops' | 'governmentSchemes', item: string) => {
    setAgriculturalProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ zIndex: 99999, pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        style={{ zIndex: 99998, pointerEvents: 'auto' }}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
        style={{ zIndex: 99999, pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sprout className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'login' ? 'Welcome Back' : 'Join Krishi Mithr'}
                </h2>
              </div>
              
              
              {/* Large Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  {mode === 'login' ? (
                    <User className="w-10 h-10 text-gray-600" />
                  ) : (
                    <Sprout className="w-10 h-10 text-green-600" />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 mb-8">
                <p className="text-gray-700 font-medium">
                  {mode === 'login' ? 'Sign in to access your personalized dashboard' : 'Create your account to unlock smart farming insights'}
                </p>
                <p className="text-sm text-gray-600">
                  {mode === 'login' ? 'Get back to your farming journey' : 'We\'ll help you optimize your agricultural practices'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Login Method Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('face')
                        setFaceImage(null)
                        stopCamera()
                      }}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        loginMethod === 'face'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      <Camera className="w-4 h-4" />
                      Face Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('phone')
                        setFaceImage(null)
                        stopCamera()
                      }}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        loginMethod === 'phone'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      <Phone className="w-4 h-4" />
                      Phone Only
                    </button>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        required
                        value={loginData.phone}
                        onChange={(e) => setLoginData({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your 10-digit phone number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Face Capture Section */}
                  {loginMethod === 'face' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Camera className="inline w-4 h-4 mr-2" />
                        Face Verification
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Position your face in front of the camera
                      </p>

                      {cameraError && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          {cameraError}
                        </div>
                      )}

                      <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '4/3', maxHeight: '200px' }}>
                        {!isCapturing && !faceImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-600">Camera not started</p>
                            </div>
                          </div>
                        )}

                        {isCapturing && (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        )}

                        {faceImage && !isCapturing && (
                          <img
                            src={faceImage}
                            alt="Captured face"
                            className="w-full h-full object-cover"
                          />
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                      </div>

                      <div className="flex gap-2">
                        {!isCapturing && !faceImage && (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Camera className="w-4 h-4" />
                            Start Camera
                          </button>
                        )}

                        {isCapturing && (
                          <>
                            <button
                              type="button"
                              onClick={captureFace}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              Capture
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {faceImage && !isCapturing && (
                          <button
                            type="button"
                            onClick={() => {
                              setFaceImage(null)
                              startCamera()
                            }}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                          >
                            Retake
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || (loginMethod === 'face' && !faceImage)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Verifying...' : loginMethod === 'face' ? 'Login with Face' : 'Login with Phone'}
                  </button>
                </form>
                  ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  {currentStep === 1 ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            value={signupData.name}
                            onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            required
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={signupData.phone}
                            onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Create a password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-green-600" />
                          Face Capture (required for signup)
                        </h3>

                        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '4/3', maxHeight: '200px' }}>
                          {!isCapturing && !faceImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-600">Camera not started</p>
                              </div>
                            </div>
                          )}

                          {isCapturing && (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                              style={{ transform: 'scaleX(-1)' }}
                            />
                          )}

                          {faceImage && !isCapturing && (
                            <img
                              src={faceImage}
                              alt="Captured face"
                              className="w-full h-full object-cover"
                            />
                          )}

                          <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="flex gap-2">
                          {!isCapturing && !faceImage && (
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              Start Camera
                            </button>
                          )}

                          {isCapturing && (
                            <>
                              <button
                                type="button"
                                onClick={captureFace}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Camera className="w-4 h-4" />
                                Capture
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {faceImage && !isCapturing && (
                            <button
                              type="button"
                              onClick={() => {
                                setFaceImage(null)
                                startCamera()
                              }}
                              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                            >
                              Retake
                            </button>
                          )}
                        </div>

                        {cameraError && (
                          <p className="text-xs text-red-600 mt-2">{cameraError}</p>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agricultural Profile</h3>
                        <p className="text-sm text-gray-600">Tell us about your farming setup</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Farm Size (acres)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            value={agriculturalProfile.farmSize}
                            onChange={(e) => updateAgriculturalProfile('farmSize', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., 5 acres"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location (State, District)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            value={agriculturalProfile.location}
                            onChange={(e) => updateAgriculturalProfile('location', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Maharashtra, Pune"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Soil Type
                        </label>
                        <select
                          required
                          value={agriculturalProfile.soilType}
                          onChange={(e) => updateAgriculturalProfile('soilType', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select soil type</option>
                          <option value="clay">Clay</option>
                          <option value="sandy">Sandy</option>
                          <option value="loamy">Loamy</option>
                          <option value="red">Red Soil</option>
                          <option value="black">Black Soil</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Irrigation Type
                        </label>
                        <div className="relative">
                          <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select
                            required
                            value={agriculturalProfile.irrigationType}
                            onChange={(e) => updateAgriculturalProfile('irrigationType', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select irrigation type</option>
                            <option value="drip">Drip Irrigation</option>
                            <option value="sprinkler">Sprinkler</option>
                            <option value="flood">Flood Irrigation</option>
                            <option value="rainfed">Rainfed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Farming Experience
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select
                            required
                            value={agriculturalProfile.farmingExperience}
                            onChange={(e) => updateAgriculturalProfile('farmingExperience', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select experience</option>
                            <option value="beginner">Beginner (0-2 years)</option>
                            <option value="intermediate">Intermediate (3-10 years)</option>
                            <option value="experienced">Experienced (10+ years)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3">
                    {currentStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        currentStep === 1 && "w-full"
                      )}
                    >
                      {isLoading 
                        ? 'Creating Account...' 
                        : currentStep === 1 
                          ? 'Next: Agricultural Profile' 
                          : 'Create Account'
                      }
                    </button>
                  </div>
                </form>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Toggle Mode Button */}
                <button
                  onClick={toggleMode}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                >
                  {mode === 'login' ? 'Create New Account' : 'Already have an account? Sign In'}
                </button>

                {/* Skip Option */}
                <button
                  onClick={handleClose}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
  )
}
