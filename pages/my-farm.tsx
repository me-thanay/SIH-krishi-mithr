"use client"

import Head from "next/head"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Sprout } from "lucide-react"
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
    <div className="min-h-screen bg-stone-50">
      <Head>
        <title>{setup ? "Farm setup" : "My Farm"} · Krishi Mithr</title>
      </Head>
      <NewNavbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
            {setup ? "Step 2 of 2 · after sign up" : "Settings"}
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-stone-900">
            <Sprout className="h-8 w-8 text-green-600" />
            {setup ? "Set up your field" : "My Farm"}
          </h1>
          <p className="mt-2 text-stone-600">
            {setup
              ? "Answer by speaking or typing. We save a draft if you stop. After you confirm, you go to the dashboard."
              : "Edit the field saved on your farmer profile. Sensor history stays linked by field id."}
          </p>
        </div>
        <VoiceFarmWizard mode={setup && !edit ? "setup" : "settings"} />
      </main>
    </div>
  )
}
