"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Camera, Phone, Sprout, X } from 'lucide-react'
import { tokenManager } from '@/lib/auth-client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
  onAuthSuccess?: (user: any) => void
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [phone, setPhone] = useState('')
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser.')
      return
    }

    setCameraError(null)
    setIsCapturing(true)

    const attachStream = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        throw new Error('Video element not found')
      }

      video.srcObject = stream
      video.muted = true
      await video.play()
    }

    try {
      await attachStream({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
    } catch (err) {
      console.warn('Front camera failed, retrying with any camera', err)
      try {
        await attachStream({ video: true })
      } catch (err2) {
        console.error('Camera error:', err2)
        setIsCapturing(false)
        setCameraError('Unable to access camera. Please allow camera permission and try again.')
      }
    }
  }

  const captureFace = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    setFaceImage(canvas.toDataURL('image/jpeg', 0.8))
    stopCamera()
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    setMode(defaultMode)
    setError('')
    setCameraError(null)
    setFaceImage(null)
    setPhone('')

    const timer = setTimeout(() => {
      void startCamera()
    }, 250)

    return () => {
      clearTimeout(timer)
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultMode])

  const handleClose = () => {
    setError('')
    setFaceImage(null)
    setPhone('')
    stopCamera()
    onClose()
  }

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode)
    setError('')
    setFaceImage(null)
    stopCamera()
    void startCamera()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }

    if (!faceImage) {
      setError('Please capture your face photo')
      return
    }

    setIsLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, faceImage }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        setError(data.error || data.message || 'Something went wrong. Please try again.')
        return
      }

      if (data.token) {
        tokenManager.setToken(data.token)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        onAuthSuccess?.(data.user)
      }

      handleClose()
    } catch (err) {
      console.error('Auth error:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative z-[1] max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Close login"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
          </div>
          <p className="text-sm text-gray-600">Phone number and face photo only.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-green-500"
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Camera className="mr-2 inline h-4 w-4" />
              Face photo
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Look at the camera, then capture your face.
            </p>

            {cameraError && (
              <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                {cameraError}
              </div>
            )}

            <div
              className="relative mb-2 overflow-hidden rounded-lg bg-gray-100"
              style={{ aspectRatio: '4 / 3', maxHeight: '220px' }}
            >
              {!isCapturing && !faceImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-xs text-gray-600">Camera not started</p>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${isCapturing ? 'block' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }}
              />

              {faceImage && !isCapturing && (
                <img
                  src={faceImage}
                  alt="Captured face"
                  className="h-full w-full object-cover"
                />
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-2">
              {!isCapturing && !faceImage && (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4" />
                  Start camera
                </button>
              )}

              {isCapturing && (
                <>
                  <button
                    type="button"
                    onClick={captureFace}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <Camera className="h-4 w-4" />
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
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
                    void startCamera()
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Retake
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !faceImage || phone.length !== 10}
            className="w-full rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          className="mt-4 w-full rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {mode === 'login' ? 'Create new account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
