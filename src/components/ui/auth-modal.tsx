"use client"

import React, { useEffect, useState } from "react"
import { Fingerprint, Phone, ScanFace, X } from "lucide-react"
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [supportsPasskeys, setSupportsPasskeys] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setMode(defaultMode)
    setError("")
    setPhone("")

    const supported = browserSupportsWebAuthn()
    setSupportsPasskeys(supported)
    if (supported) {
      void platformAuthenticatorIsAvailable().then((available) => {
        setSupportsPasskeys(available)
      })
    }
  }, [isOpen, defaultMode])

  const handleClose = () => {
    setError("")
    setPhone("")
    onClose()
  }

  const finishAuth = (data: { token?: string; user?: unknown }) => {
    if (data.token) tokenManager.setToken(data.token)
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user))
      onAuthSuccess?.(data.user)
    }
    handleClose()
  }

  const handlePasskey = async () => {
    setError("")

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number")
      return
    }

    if (!browserSupportsWebAuthn()) {
      setError("This browser does not support Face ID or fingerprint login.")
      return
    }

    setIsLoading(true)

    try {
      if (mode === "signup") {
        const optionsRes = await fetch("/api/auth/webauthn/register-options", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        })
        const options = await optionsRes.json()
        if (!optionsRes.ok || options.error) {
          setError(options.error || "Could not start Face ID registration")
          return
        }

        const attResp = await startRegistration({ optionsJSON: options })
        const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, attResp }),
        })
        const data = await verifyRes.json()
        if (!verifyRes.ok || !data.success) {
          setError(data.error || "Face ID registration failed")
          return
        }
        finishAuth(data)
        return
      }

      const optionsRes = await fetch("/api/auth/webauthn/login-options", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const options = await optionsRes.json()
      if (!optionsRes.ok || options.error) {
        setError(options.error || "Could not start Face ID login")
        return
      }

      const authResp = await startAuthentication({ optionsJSON: options })
      const verifyRes = await fetch("/api/auth/webauthn/login-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, authResp }),
      })
      const data = await verifyRes.json()
      if (!verifyRes.ok || !data.success) {
        setError(data.error || "Face ID login failed")
        return
      }
      finishAuth(data)
    } catch (err) {
      console.error("WebAuthn error:", err)
      const name = err instanceof Error ? err.name : ""
      if (name === "NotAllowedError") {
        setError("Face ID / fingerprint was cancelled. Try again.")
      } else if (name === "InvalidStateError") {
        setError("This device is already registered. Sign in instead.")
      } else {
        setError(err instanceof Error ? err.message : "Could not use Face ID / fingerprint. Try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

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
                {mode === "login" ? "Unlock like your phone." : "Register this device."}
              </h2>
              <p className="mt-4 max-w-xs text-sm font-light text-white/80">
                Phone number plus Face ID or fingerprint. Same prompt your phone uses to unlock.
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
              Phone number and Face ID / fingerprint only.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!supportsPasskeys && (
            <div className="mb-5 rounded-2xl border border-[#122023]/10 bg-white px-4 py-3 text-sm text-[#122023]/70">
              This device has no Face ID or fingerprint sensor. Use a phone that can unlock with biometrics.
            </div>
          )}

          <div className="space-y-6">
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

            <div className="flex justify-center gap-6 py-2 text-[#122023]/45">
              <ScanFace className="h-10 w-10" />
              <Fingerprint className="h-10 w-10" />
            </div>

            <button
              type="button"
              disabled={isLoading || phone.length !== 10}
              onClick={() => void handlePasskey()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e1fcad] py-3.5 text-sm font-medium text-[#122023] transition-colors hover:bg-[#122023] hover:text-[#e1fcad] disabled:cursor-not-allowed disabled:bg-[#d7d3c8] disabled:text-[#122023]/35 disabled:hover:bg-[#d7d3c8] disabled:hover:text-[#122023]/35"
            >
              <Fingerprint className="h-4 w-4" />
              {isLoading
                ? mode === "login"
                  ? "Waiting for Face ID..."
                  : "Waiting to register..."
                : mode === "login"
                  ? "Unlock with Face ID / fingerprint"
                  : "Register Face ID / fingerprint"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#122023]/60">
            {mode === "login" ? "New here?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setError("")
              }}
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
