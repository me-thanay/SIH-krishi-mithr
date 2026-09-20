"use client"

import Head from "next/head"
import dynamic from "next/dynamic"
import { Sprout } from "lucide-react"
import { NewNavbar } from "../src/components/ui/new-navbar"

// Web Speech API is browser-only.
const VoiceFarmWizard = dynamic(() => import("../src/components/my-farm/voice-farm-wizard"), { ssr: false })

export default function MyFarmPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Head>
        <title>My Farm · Krishi Mithr</title>
      </Head>
      <NewNavbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-stone-900">
            <Sprout className="h-8 w-8 text-green-600" />
            My Farm
          </h1>
          <p className="mt-2 text-stone-600">
            Register your field by talking. Pick a language, answer nine short questions, hear them read back, correct anything by
            voice, and save.
          </p>
        </div>
        <VoiceFarmWizard />
      </main>
    </div>
  )
}
