"use client"

// Bridge page so /dashboard works on Netlify (Pages router → App router component)
import DashboardPage from "../src/app/dashboard/page"

export default function DashboardBridge() {
  return <DashboardPage />
}

