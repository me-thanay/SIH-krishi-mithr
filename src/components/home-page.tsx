"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import SmartAgriTechComponent from "@/components/smart-agri-tech"
import Hero from "@/components/ui/demo"
import { NewNavbar } from "@/components/ui/new-navbar"

export default function HomePage() {
  const [showProject, setShowProject] = useState(false)

  const syncFromHash = useCallback(() => {
    if (typeof window === "undefined") return
    setShowProject(window.location.hash.replace("#", "") === "operations")
  }, [])

  useEffect(() => {
    syncFromHash()
    window.addEventListener("hashchange", syncFromHash)
    window.addEventListener("popstate", syncFromHash)
    return () => {
      window.removeEventListener("hashchange", syncFromHash)
      window.removeEventListener("popstate", syncFromHash)
    }
  }, [syncFromHash])

  const openProject = () => {
    setShowProject(true)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/#operations")
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <NewNavbar variant={showProject ? "solid" : "hero"} />
      <Hero onStartProject={openProject} />

      <AnimatePresence>
        {showProject && (
          <motion.div
            key="operations"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[900] overflow-y-auto"
          >
            <SmartAgriTechComponent hideNavbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
