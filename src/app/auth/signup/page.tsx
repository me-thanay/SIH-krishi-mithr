"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sprout, Camera, User, Phone, CreditCard, MapPin } from "lucide-react"

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    phone: "",
    aadharNumber: "",
    aadharName: "",
    aadharDob: "",
    aadharAddress: "",
    landArea: ""
  })
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  // Validate Aadhar number (12 digits)
  const validateAadhar = (aadhar: string) => {
    const aadharRegex = /^\d{12}$/
    return aadharRegex.test(aadhar.replace(/\s/g, ''))
  }

  // Validate phone number (10 digits)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePhone(formData.phone)) {
      alert('Please enter a valid 10-digit phone number')
      return
    }
    setStep(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAadhar(formData.aadharNumber)) {
      alert('Please enter a valid 12-digit Aadhar number')
      return
    }
    if (!formData.aadharName || !formData.aadharDob || !formData.aadharAddress) {
      alert('Please fill all Aadhar card details')
      return
    }
    setStep(3)
  }

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!faceImage) {
      alert('Please capture your face photo for verification')
      return
    }
    if (!formData.landArea) {
      alert('Please enter your land area')
      return
    }
    setStep(4)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          aadharNumber: formData.aadharNumber.replace(/\s/g, ''),
          aadharName: formData.aadharName,
          aadharDob: formData.aadharDob,
          aadharAddress: formData.aadharAddress,
          faceImage: faceImage,
          landArea: formData.landArea,
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
      alert(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 4</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? "Phone Number" : step === 2 ? "Aadhar Card Details" : step === 3 ? "Face Verification" : "Land Area & Review"}
          </h1>
          <p className="text-gray-600">
            {step === 1 ? "Enter your phone number" : step === 2 ? "Enter your Aadhar card information" : step === 3 ? "Capture your face for verification" : "Enter land area and review"}
          </p>
        </div>

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-6">
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

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue to Aadhar Details
            </button>
          </form>
        )}

        {/* Step 2: Aadhar Card Details */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div>
              <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="inline w-4 h-4 mr-2" />
                Aadhar Number
              </label>
              <input
                type="text"
                id="aadharNumber"
                required
                value={formData.aadharNumber}
                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter 12-digit Aadhar number"
                maxLength={12}
              />
              <p className="mt-1 text-sm text-gray-500">Enter your 12-digit Aadhar number</p>
            </div>

            <div>
              <label htmlFor="aadharName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Name as on Aadhar Card
              </label>
              <input
                type="text"
                id="aadharName"
                required
                value={formData.aadharName}
                onChange={(e) => setFormData({ ...formData, aadharName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter name as shown on Aadhar card"
              />
            </div>

            <div>
              <label htmlFor="aadharDob" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth (as on Aadhar)
              </label>
              <input
                type="date"
                id="aadharDob"
                required
                value={formData.aadharDob}
                onChange={(e) => setFormData({ ...formData, aadharDob: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="aadharAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Address (as on Aadhar)
              </label>
              <textarea
                id="aadharAddress"
                required
                value={formData.aadharAddress}
                onChange={(e) => setFormData({ ...formData, aadharAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter address as shown on Aadhar card"
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Continue to Face Verification
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Face Detection */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Face Verification</h3>
              <p className="text-sm text-gray-600 mb-6">
                Please position your face in front of the camera and ensure good lighting
              </p>
            </div>

            {cameraError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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

            <div className="flex flex-col gap-3">
              {!isCapturing && !faceImage && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              )}

              {isCapturing && (
                <>
                  <button
                    type="button"
                    onClick={captureFace}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
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
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Retake Photo
                </button>
              )}
            </div>

            {faceImage && (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Continue to Land Area
                </button>
              </div>
            )}
          </form>
        )}

        {/* Step 4: Land Area and Review */}
        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <label htmlFor="landArea" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-2" />
                Land Area (Acres)
              </label>
              <input
                type="text"
                id="landArea"
                required
                value={formData.landArea}
                onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your land area in acres (e.g., 5)"
              />
              <p className="mt-1 text-sm text-gray-500">Enter the total area of your agricultural land in acres</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
              
              <div>
                <h4 className="font-medium text-gray-700">Contact Information</h4>
                <p className="text-gray-600">Phone: {formData.phone}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Aadhar Details</h4>
                <p className="text-gray-600">Aadhar Number: {formData.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}</p>
                <p className="text-gray-600">Name: {formData.aadharName}</p>
                <p className="text-gray-600">Date of Birth: {new Date(formData.aadharDob).toLocaleDateString()}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Land Information</h4>
                <p className="text-gray-600">Land Area: {formData.landArea} acres</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Face Verification</h4>
                {faceImage && (
                  <div className="mt-2">
                    <img
                      src={faceImage}
                      alt="Face verification"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <p className="text-sm text-green-600 mt-1">✓ Face captured successfully</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Complete Signup"}
              </button>
            </div>
          </form>
        )}

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
