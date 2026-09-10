"use client"

// Bridge page so /dashboard works on Netlify (Pages router → App router component)
import DashboardPage from "../src/app/dashboard/page"
import { NewNavbar } from "../src/components/ui/new-navbar"

export default function DashboardBridge() {
  return (
    <>
      <NewNavbar />
      <DashboardPage />
    </>
  )
}

