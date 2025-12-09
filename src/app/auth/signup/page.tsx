"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/")
  }, [router])

  return null
}

  // Start camera for face detection
  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCapturing(true)
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Unable to access camera. Please ensure camera permissions are granted.')
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

  // Validate phone number (10 digits)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError(null)
    
    if (!formData.phone) {
      setSignupError('Please enter your phone number')
      return
    }
    
    if (!validatePhone(formData.phone)) {
      setSignupError('Please enter a valid 10-digit phone number')
      return
  }

    if (!faceImage) {
      setSignupError('Please capture your face photo for verification')
      return
  }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          faceImage: faceImage,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        alert('Account created successfully! Please login to continue.')
        router.push('/auth/login')
      } else {
        throw new Error(data.error || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setSignupError(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600">Sign up for Krishi Mithr</p>
        </div>

        {/* Error Message */}
        {signupError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {signupError}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your 10-digit phone number"
                maxLength={10}
              />
              <p className="mt-1 text-sm text-gray-500">Enter your 10-digit mobile number</p>
            </div>

          {/* Face Capture Section */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="inline w-4 h-4 mr-2" />
              Face Verification
              </label>
            <p className="text-sm text-gray-500 mb-3">
              Position your face in front of the camera for verification
            </p>

            {cameraError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {cameraError}
              </div>
            )}

            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {!isCapturing && !faceImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Camera not started</p>
                  </div>
                </div>
              )}

              {isCapturing && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
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

            <div className="mt-3 flex flex-col gap-2">
              {!isCapturing && !faceImage && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Capture & Verify
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
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
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Retake Photo
                </button>
                )}
              </div>
            </div>

              <button
                type="submit"
            disabled={isLoading || !faceImage}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
            {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
          </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
