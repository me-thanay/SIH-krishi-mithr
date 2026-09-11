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
      <NewNavbar variant="hero" />
      <main className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-[#122023]/50" />
      </main>
    </>
  )
}
