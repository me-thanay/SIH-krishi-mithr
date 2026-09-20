"use client"

import React, { useEffect, useState } from "react"
import { Sprout, RefreshCw, Loader2, AlertTriangle, CloudSun, Pencil } from "lucide-react"
import { Card } from "./card"
import Link from "next/link"

type Brief = {
  headline?: string
  today?: string
  attention?: string[]
  tomorrow?: string[]
  missing?: string[]
  date?: string
  comparison?: {
    moisture_band?: { min: number; max: number; note: string }
    soil_avg?: number | null
    soil_vs_band?: string
    dry_hours?: number
    wet_hours?: number
    motor_on_events?: number
    rain_detections?: number
    missing_minutes?: number
    hours_covered?: number
  }
}

type HourRow = {
  hour_start?: string
  soil_moisture?: { avg?: number; min?: number; max?: number; n?: number }
  valid_readings?: number
  missing_minutes?: number
}

export function FieldDecisionPanel() {
  const [brief, setBrief] = useState<Brief | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [hours, setHours] = useState<HourRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headers = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const load = async (refresh = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) {
      setLoading(false)
      setError("Sign in so field suggestions use your farm details.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [h, b] = await Promise.all([
        fetch("/api/farm/hourly?hours=24", { headers: headers() }),
        fetch(`/api/farm/brief${refresh ? "?refresh=1" : ""}`, { headers: headers() }),
      ])
      const hj = await h.json()
      const bj = await b.json()
      setProfile(hj.profile)
      setHours(hj.hours || [])
      setBrief(bj.brief || null)
      if (!hj.profile) setError("Finish farm setup so readings can be compared with your crop.")
    } catch (e: any) {
      setError(e?.message || "Could not load field decision")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const band = brief?.comparison?.moisture_band
  const soils = hours.map((h) => h.soil_moisture?.avg).filter((n): n is number => typeof n === "number")
  const maxBar = soils.length ? Math.max(100, ...soils) : 100

  return (
    <Card className="border-2 border-emerald-100 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Field decision</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-stone-800">
            <Sprout className="h-5 w-5 text-green-600" />
            {profile?.fieldName || "Your field"} · {profile?.crop || "crop not set"}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {profile?.growthStage || "stage unknown"}
            {profile?.irrigationMethod ? ` · ${profile.irrigationMethod}` : ""}
            {profile?.soilType ? ` · ${profile.soilType} soil` : ""}
            {brief?.date ? ` · brief ${brief.date}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/my-farm?edit=1" className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2.5 text-xs text-stone-600 hover:bg-stone-50">
            <Pencil className="h-3.5 w-3.5" /> Edit farm
          </Link>
          <button
            type="button"
            onClick={() => void load(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-xs text-stone-600 hover:bg-stone-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}{" "}
          {!profile && (
            <Link href="/my-farm?setup=1" className="underline">
              Open farm setup
            </Link>
          )}
        </p>
      )}

      {band && (
        <p className="mb-3 text-sm text-stone-600">
          Typical moisture for this crop/stage: <strong>{band.min}–{band.max}%</strong>
          {brief?.comparison?.soil_avg != null && (
            <> · last 24h average <strong>{brief.comparison.soil_avg}%</strong> ({brief.comparison.soil_vs_band?.replace(/_/g, " ")})</>
          )}
          {brief?.comparison?.dry_hours ? ` · ${brief.comparison.dry_hours} dry hours` : ""}
          {brief?.comparison?.motor_on_events ? ` · motor on ${brief.comparison.motor_on_events}×` : ""}
          {brief?.comparison?.missing_minutes ? ` · ${brief.comparison.missing_minutes} min gaps` : ""}
        </p>
      )}

      {hours.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-stone-400">Hourly soil moisture (24h)</p>
          <div className="flex h-16 items-end gap-0.5">
            {hours.map((h, i) => {
              const v = h.soil_moisture?.avg
              const height = v == null ? 8 : Math.max(8, (v / maxBar) * 100)
              const dry = band && v != null && v < band.min
              const wet = band && v != null && v > band.max
              return (
                <div
                  key={i}
                  title={`${h.hour_start || ""} · ${v ?? "no data"}%`}
                  className={`flex-1 rounded-t ${v == null ? "bg-stone-200" : dry ? "bg-amber-500" : wet ? "bg-sky-500" : "bg-green-500"}`}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">{hours.length} hourly summaries · each bar is avg/min/max of that hour, not a single sample</p>
        </div>
      )}

      {brief?.headline && <p className="mb-2 text-base font-medium text-stone-800">{brief.headline}</p>}
      {brief?.today && <p className="mb-3 text-sm leading-relaxed text-stone-700">{brief.today}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-amber-50 px-3 py-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-amber-900">
            {(brief?.attention || []).length ? brief!.attention!.map((t, i) => <li key={i}>{t}</li>) : <li>None yet — waiting for hourly readings.</li>}
          </ul>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
            <CloudSun className="h-3.5 w-3.5" /> Tomorrow
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-emerald-900">
            {(brief?.tomorrow || []).length ? brief!.tomorrow!.map((t, i) => <li key={i}>{t}</li>) : <li>Refresh after sensors have logged a day.</li>}
          </ul>
        </div>
        <div className="rounded-2xl bg-stone-50 px-3 py-3">
          <p className="text-xs font-semibold text-stone-600">Missing</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-stone-700">
            {(brief?.missing || []).length ? brief!.missing!.map((t, i) => <li key={i}>{t}</li>) : <li>No gaps called out.</li>}
          </ul>
        </div>
      </div>
    </Card>
  )
}
