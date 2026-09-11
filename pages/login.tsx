"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { NewNavbar } from "../src/components/ui/new-navbar"
import { useAuth } from "../src/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, showAuthModal } = useAuth()

  useEffect(() => {
    showAuthModal("login")
  }, [showAuthModal])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <>
      <NewNavbar />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-16">
        <p className="text-center text-gray-600">
          Sign in with your phone number and face photo.
        </p>
      </main>
    </>
  )
}
