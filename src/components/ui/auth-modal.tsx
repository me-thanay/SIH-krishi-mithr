"use client"

import React, { useEffect, useRef, useState } from "react"
import { Camera, Phone, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { tokenManager } from "@/lib/auth-client"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "signup"
  onAuthSuccess?: (user: any) => void
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode)
  const [phone, setPhone] = useState("")
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
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
    setVideoReady(false)
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser.")
      return
    }

    setCameraError(null)
    setVideoReady(false)
    setIsCapturing(true)

    const attachStream = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        throw new Error("Video element not found")
      }

      video.srcObject = stream
      video.muted = true
      await video.play()
      setVideoReady(video.videoWidth > 0)
    }

    try {
      await attachStream({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
    } catch (err) {
      console.warn("Front camera failed, retrying with any camera", err)
      try {
        await attachStream({ video: true })
      } catch (err2) {
        console.error("Camera error:", err2)
        setIsCapturing(false)
        setVideoReady(false)
        setCameraError("Allow camera access to capture your face, then try again.")
      }
    }
  }

  const captureFace = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) {
      setCameraError("Camera is not ready yet. Allow camera access and try again.")
      return
    }

    const context = canvas.getContext("2d")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    setFaceImage(canvas.toDataURL("image/jpeg", 0.8))
    stopCamera()
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    setMode(defaultMode)
    setError("")
    setCameraError(null)
    setFaceImage(null)
    setPhone("")

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
    setError("")
    setFaceImage(null)
    setPhone("")
    stopCamera()
    onClose()
  }

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode)
    setError("")
    setFaceImage(null)
    stopCamera()
    void startCamera()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number")
      return
    }

    if (!faceImage) {
      setError("Please capture your face photo")
      return
    }

    setIsLoading(true)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, faceImage }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        setError(data.error || data.message || "Something went wrong. Please try again.")
        return
      }

      if (data.token) {
        tokenManager.setToken(data.token)
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        onAuthSuccess?.(data.user)
      }

      handleClose()
    } catch (err) {
      console.error("Auth error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const canSubmit = !isLoading && Boolean(faceImage) && phone.length === 10

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#122023]/75 backdrop-blur-md"
        onClick={handleClose}
      />

      <div
        className="relative z-[1] grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-[#f6f4ee] shadow-[0_30px_80px_rgba(18,32,35,0.45)] md:grid-cols-[0.9fr_1.1fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="relative hidden min-h-[280px] overflow-hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#122023] via-[#122023]/50 to-black/20" />
          <div className="relative flex h-full min-h-[280px] flex-col justify-between p-8 text-white">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-white/80">
              Krishi Mithr
            </p>
            <div>
              <h2 className="font-kanturmuy text-4xl leading-tight tracking-tight lg:text-5xl">
                {mode === "login" ? "Welcome back to the field." : "Start your farm profile."}
              </h2>
              <p className="mt-4 max-w-xs text-sm font-light text-white/80">
                Sign in with your mobile number and a quick face photo. No passwords.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative overflow-y-auto px-5 py-6 sm:px-10 sm:py-10">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-2 text-[#122023]/60 transition-colors hover:bg-[#122023]/5 hover:text-[#122023]"
            aria-label="Close login"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-7 md:hidden">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#122023]/50">
              Krishi Mithr
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-kanturmuy text-3xl tracking-tight text-[#122023]">
              {mode === "login" ? "Sign in" : "Create account"}
            </h3>
            <p className="mt-1 text-sm text-[#122023]/65">
              Phone number and face photo only.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#122023]">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/40" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full rounded-full border border-[#122023]/10 bg-white py-3.5 pl-11 pr-4 text-[#122023] outline-none transition placeholder:text-[#122023]/35 focus:border-[#122023]/30 focus:ring-2 focus:ring-[#e1fcad]"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <label className="block text-sm font-medium text-[#122023]">
                    Face photo
                  </label>
                  <p className="mt-0.5 text-xs text-[#122023]/55">
                    Center your face in the circle, then capture.
                  </p>
                </div>
              </div>

              {cameraError && (
                <div className="mb-3 rounded-2xl border border-red-200/80 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {cameraError}
                </div>
              )}

              <div className="flex flex-col items-center">
                <div className="relative mb-4 size-52">
                  <div className="absolute inset-0 rounded-full bg-[#e1fcad]/40" />
                  <div className="absolute inset-[6px] overflow-hidden rounded-full border border-white/80 bg-[#d9d4c8] shadow-inner">
                    {!faceImage && !videoReady && (
                      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                        <Camera className="mb-2 h-7 w-7 text-[#122023]/35" />
                        <p className="text-xs leading-relaxed text-[#122023]/55">
                          {isCapturing
                            ? "Waiting for camera…"
                            : "Camera is off"}
                        </p>
                      </div>
                    )}

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onPlaying={() => setVideoReady((videoRef.current?.videoWidth || 0) > 0)}
                      className={cn(
                        "h-full w-full object-cover",
                        isCapturing && videoReady ? "block" : "hidden"
                      )}
                      style={{ transform: "scaleX(-1)" }}
                    />

                    {faceImage && !isCapturing && (
                      <img
                        src={faceImage}
                        alt="Captured face"
                        className="h-full w-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex w-full max-w-sm items-center justify-center gap-2">
                  {!isCapturing && !faceImage && (
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#122023] px-5 py-3 text-sm font-medium text-[#e1fcad] transition-colors hover:bg-[#1d3337]"
                    >
                      <Camera className="h-4 w-4" />
                      Enable camera
                    </button>
                  )}

                  {isCapturing && (
                    <>
                      <button
                        type="button"
                        onClick={captureFace}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#e1fcad] px-5 py-3 text-sm font-medium text-[#122023] transition-colors hover:bg-[#122023] hover:text-[#e1fcad]"
                      >
                        <Camera className="h-4 w-4" />
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-full border border-[#122023]/15 bg-white px-4 py-3 text-sm font-medium text-[#122023]/70 transition-colors hover:bg-[#122023]/5"
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
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#122023]/15 bg-white px-5 py-3 text-sm font-medium text-[#122023] transition-colors hover:bg-[#122023]/5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retake photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-full bg-[#e1fcad] py-3.5 text-sm font-medium text-[#122023] transition-colors hover:bg-[#122023] hover:text-[#e1fcad] disabled:cursor-not-allowed disabled:bg-[#d7d3c8] disabled:text-[#122023]/35 disabled:hover:bg-[#d7d3c8] disabled:hover:text-[#122023]/35"
            >
              {isLoading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#122023]/60">
            {mode === "login" ? "New here?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-[#122023] underline decoration-[#e1fcad] decoration-2 underline-offset-4 hover:text-[#1d3337]"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
