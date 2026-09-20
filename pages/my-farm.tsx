"use client"

import Head from "next/head"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { NewNavbar } from "../src/components/ui/new-navbar"
import { useAuth } from "../src/contexts/AuthContext"

const VoiceFarmWizard = dynamic(() => import("../src/components/my-farm/voice-farm-wizard"), { ssr: false })

export default function MyFarmPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, showAuthModal } = useAuth()
  const setup = router.query.setup === "1"
  const edit = router.query.edit === "1"

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) showAuthModal(setup ? "signup" : "login")
  }, [isAuthenticated, isLoading, setup, showAuthModal])

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <Head>
        <title>{setup ? "Farm setup" : "My Farm"} · Krishi Mithr</title>
      </Head>
      <NewNavbar variant="hero" />
      <main className="pt-16">
        <VoiceFarmWizard mode={setup && !edit ? "setup" : "settings"} />
      </main>
    </div>
  )
}
