"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Sprout, Camera, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
  onAuthSuccess?: (user: any) => void
}


export function AuthModal({ isOpen, onClose, defaultMode = 'login', onAuthSuccess }: AuthModalProps) {
  // Auth disabled - always return null
  return null
  
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [isLoading, setIsLoading] = useState(false)
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

  // Signup form state - only phone and face
  const [signupData, setSignupData] = useState({
    phone: ''
  })
  const [signupFaceImage, setSignupFaceImage] = useState<string | null>(null)
  const [signupIsCapturing, setSignupIsCapturing] = useState(false)
  const [signupCameraError, setSignupCameraError] = useState<string | null>(null)
  const signupVideoRef = useRef<HTMLVideoElement>(null)
  const signupCanvasRef = useRef<HTMLCanvasElement>(null)
  const signupStreamRef = useRef<MediaStream | null>(null)

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
      stopSignupCamera()
    }
  }, [])

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
    setMode(defaultMode)
    setFaceImage(null)
    setSignupFaceImage(null)
    stopCamera()
    stopSignupCamera()
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

  // Signup camera functions
  const startSignupCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSignupCameraError('Camera not supported in this browser/environment.')
      return
    }

    setSignupCameraError(null)
    setSignupIsCapturing(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      signupStreamRef.current = stream
      
      if (signupVideoRef.current) {
        signupVideoRef.current.srcObject = stream
        await signupVideoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setSignupIsCapturing(false)
      setSignupCameraError('Unable to access camera. Please allow camera permission and try again.')
    }
  }

  const stopSignupCamera = () => {
    if (signupStreamRef.current) {
      signupStreamRef.current.getTracks().forEach(track => track.stop())
      signupStreamRef.current = null
    }
    if (signupVideoRef.current) {
      signupVideoRef.current.srcObject = null
    }
    setSignupIsCapturing(false)
  }

  const captureSignupFace = () => {
    if (signupVideoRef.current && signupCanvasRef.current) {
      const video = signupVideoRef.current
      const canvas = signupCanvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setSignupFaceImage(imageData)
      stopSignupCamera()
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!signupData.phone) {
      setError('Please enter your phone number')
      return
    }

    if (!validatePhone(signupData.phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    if (!signupFaceImage) {
      setError('Please capture your face photo for verification')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: signupData.phone,
          faceImage: signupFaceImage
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user))
        onAuthSuccess?.(data.user)
        handleClose()
        alert('Account created successfully! Please login to continue.')
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
    setSignupFaceImage(null)
    stopSignupCamera()
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
                            src={faceImage ?? undefined}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        required
                        value={signupData.phone}
                        onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your 10-digit phone number"
                        maxLength={10}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter your 10-digit mobile number</p>
                  </div>

                  {/* Face Capture Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Camera className="inline w-4 h-4 mr-2" />
                      Face Verification
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Position your face in front of the camera for verification
                    </p>

                    {signupCameraError && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        {signupCameraError}
                      </div>
                    )}

                    <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '4/3', maxHeight: '200px' }}>
                      {!signupIsCapturing && !signupFaceImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">Camera not started</p>
                          </div>
                        </div>
                      )}

                      {signupIsCapturing && (
                        <video
                          ref={signupVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      )}

                      {signupFaceImage && !signupIsCapturing && (
                        <img
                          src={signupFaceImage ?? undefined}
                          alt="Captured face"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {signupFaceImage && !signupIsCapturing && (
                        <img
                          src={signupFaceImage ?? undefined}
                          alt="Captured face"
                          className="w-full h-full object-cover"
                        />
                      )}

                      <canvas ref={signupCanvasRef} className="hidden" />
                    </div>

                    <div className="flex gap-2">
                      {!signupIsCapturing && !signupFaceImage && (
                        <button
                          type="button"
                          onClick={startSignupCamera}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Start Camera
                        </button>
                      )}

                      {signupIsCapturing && (
                        <>
                          <button
                            type="button"
                            onClick={captureSignupFace}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Camera className="w-4 h-4" />
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={stopSignupCamera}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {signupFaceImage && !signupIsCapturing && (
                        <button
                          type="button"
                          onClick={() => {
                            setSignupFaceImage(null)
                            startSignupCamera()
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          Retake
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !signupFaceImage}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>
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
