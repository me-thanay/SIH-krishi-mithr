"use client"

import React, { useEffect, useState } from "react"
import {
  Sprout,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CloudSun,
  Pencil,
  HelpCircle,
  Droplets,
  Activity,
  Bug,
  Power,
  TrendingUp,
} from "lucide-react"
import { Card } from "./card"
import Link from "next/link"
import { ScrollReveal } from "./scroll-reveal"
import { loadFarmLocal } from "@/lib/farm-local-client"

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

type Brief = {
  headline?: string
  today?: string
  attention?: string[]
  tomorrow?: string[]
  missing?: string[]
  date?: string
  camera?: { summary?: string; findings?: { name?: string }[]; certainty?: string } | null
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
}

type Head = {
  label?: string
  advice?: string
  value?: number
  display?: string
  hide_confidence?: boolean
  observation?: boolean
}

type Advisory = {
  summary?: string
  irrigation?: Head
  stress_risk?: Head
  disease_climate_risk?: Head
  motor?: Head
  yield_score?: Head
  price_trend?: Head
  note?: string
  inputs?: { weather_city?: string; sensor_used?: boolean }
}

function Pill({ icon, title, head }: { icon: React.ReactNode; title: string; head?: Head }) {
  if (!head) return null
  const headline = head.display || (head.value != null ? `${head.value}/100` : head.label || "—")
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-stone-800">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-sm text-stone-700">{headline}</p>
      {head.observation && (
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-stone-400">Observation · not an AI prediction</p>
      )}
      {head.advice && <p className="mt-1 text-xs leading-relaxed text-stone-500">{head.advice}</p>}
    </div>
  )
}

export function FieldDecisionPanel() {
  const [brief, setBrief] = useState<Brief | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [hours, setHours] = useState<HourRow[]>([])
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setupDone = Boolean(profile?.setupComplete && profile?.crop)

  const headers = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const loadAdvisory = async (p: any) => {
    const lat = p?.location?.lat
    const lon = p?.location?.lon
    const qs = new URLSearchParams()
    if (lat != null && lon != null) {
      qs.set("lat", String(lat))
      qs.set("lon", String(lon))
    } else {
      qs.set("city", p?.location?.district || p?.location?.state || "Hyderabad")
    }
    try {
      const r = await fetch(`/api/advisory/predict?${qs.toString()}`)
      const j = await r.json().catch(() => ({}))
      if (r.ok) setAdvisory(j)
      else setAdvisory(null)
    } catch {
      setAdvisory(null)
    }
  }

  const load = async (refresh = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) {
      setLoading(false)
      setProfile(null)
      setBrief(null)
      setAdvisory(null)
      setError("Sign in and finish My Farm so recommendations can use your field.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const h = await fetch("/api/farm/hourly?hours=24", { headers: headers() })
      const hj = await h.json()
      const nextProfile = hj.profile || loadFarmLocal()
      setProfile(nextProfile)
      setHours(hj.hours || [])
      const ready = Boolean(nextProfile?.setupComplete && nextProfile?.crop)
      if (!ready) {
        setBrief(null)
        setAdvisory(null)
        setError("Finish the My Farm survey first. Recommendations use your crop, sensors, leaf photos, and weather together.")
        return
      }
      const [b] = await Promise.all([
        fetch("/api/farm/brief", {
          method: "POST",
          headers: { ...headers(), "Content-Type": "application/json" },
          body: JSON.stringify({ profile: nextProfile, force: refresh }),
        }),
        loadAdvisory(nextProfile),
      ])
      const bj = await b.json()
      setBrief(bj.brief || null)
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
            {setupDone ? `${profile?.fieldName || "Your field"} · ${profile?.crop}` : "Recommendations after My Farm"}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {setupDone
              ? `${profile?.growthStage || "stage unknown"}${profile?.irrigationMethod ? ` · ${profile.irrigationMethod}` : ""}${profile?.soilType ? ` · ${profile.soilType} soil` : ""}${brief?.date ? ` · brief ${brief.date}` : ""}`
              : "Survey + sensors + leaf photos + weather — nothing is suggested until the field is saved."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={setupDone ? "/my-farm?edit=1" : "/my-farm?setup=1"} className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2.5 text-xs text-stone-600 hover:bg-stone-50">
            <Pencil className="h-3.5 w-3.5" /> {setupDone ? "Edit farm" : "Open My Farm"}
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
        <ScrollReveal once transition={{ duration: 0.45, ease: "easeOut" }} variants={reveal} viewOptions={{ amount: 0.4 }}>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}{" "}
            {!setupDone && (
              <Link href="/my-farm?setup=1" className="font-medium underline underline-offset-2">
                Open farm setup
              </Link>
            )}
          </div>
        </ScrollReveal>
      )}

      {setupDone && (
        <>
          {band && (
            <p className="mb-3 mt-4 text-sm text-stone-600">
              Typical moisture for {profile?.crop} / {profile?.growthStage || "this stage"}: <strong>{band.min}–{band.max}%</strong>
              {brief?.comparison?.soil_avg != null && (
                <> · last 24h average <strong>{brief.comparison.soil_avg}%</strong> ({brief.comparison.soil_vs_band?.replace(/_/g, " ")})</>
              )}
              {brief?.comparison?.dry_hours ? ` · ${brief.comparison.dry_hours} dry hours` : ""}
              {brief?.comparison?.motor_on_events ? ` · motor on ${brief.comparison.motor_on_events}×` : ""}
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
            </div>
          )}

          {brief?.camera?.summary && (
            <p className="mb-3 text-sm text-stone-600">
              Latest leaf photo: <strong>{brief.camera.summary}</strong>
              {brief.camera.certainty ? ` · ${brief.camera.certainty}` : ""}
            </p>
          )}

          {brief?.headline && <p className="mb-2 text-base font-medium text-stone-800">{brief.headline}</p>}
          {brief?.today && <p className="mb-4 text-sm leading-relaxed text-stone-700">{brief.today}</p>}

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                {
                  title: "Needs attention",
                  icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
                  items: brief?.attention?.length ? brief.attention : ["Waiting for enough sensor hours, a leaf photo, or weather."],
                },
                {
                  title: "Tomorrow",
                  icon: <CloudSun className="h-5 w-5 text-emerald-600" />,
                  items: brief?.tomorrow?.length ? brief.tomorrow : ["Refresh after sensors and weather have a full day with your crop."],
                },
                {
                  title: "Missing",
                  icon: <HelpCircle className="h-5 w-5 text-stone-500" />,
                  items: brief?.missing?.length ? brief.missing : ["No gaps called out."],
                },
              ] as const
            ).map((card, i) => (
              <ScrollReveal
                key={card.title}
                once
                transition={{ delay: i * 0.12, duration: 0.5, ease: "easeOut" }}
                variants={reveal}
                viewOptions={{ amount: 0.3 }}
              >
                <div className="h-full rounded-xl border border-border bg-card p-5">
                  <p className="mb-2">{card.icon}</p>
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {card.items.map((t, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {(advisory?.irrigation || advisory?.summary) && (
            <div className="mt-6">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Sensors + weather aid</p>
              <p className="mb-3 text-xs text-stone-500">
                Read with your My Farm crop. {advisory?.inputs?.weather_city || ""}
                {advisory?.inputs?.sensor_used ? " · latest ESP sensors" : " · weather only so far"}
              </p>
              {advisory?.summary && <p className="mb-3 text-sm leading-relaxed text-stone-700">{advisory.summary}</p>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Pill icon={<Droplets className="h-4 w-4 text-blue-600" />} title="Irrigation" head={advisory?.irrigation} />
                <Pill icon={<Activity className="h-4 w-4 text-amber-600" />} title="Crop stress" head={advisory?.stress_risk} />
                <Pill icon={<Bug className="h-4 w-4 text-red-600" />} title="Disease climate" head={advisory?.disease_climate_risk} />
                <Pill icon={<Power className="h-4 w-4 text-emerald-700" />} title="Motor / pump" head={advisory?.motor} />
                <Pill icon={<Sprout className="h-4 w-4 text-green-700" />} title="Growing index" head={advisory?.yield_score} />
                <Pill icon={<TrendingUp className="h-4 w-4 text-indigo-600" />} title="Price trend" head={advisory?.price_trend} />
              </div>
              {advisory?.note && <p className="mt-3 text-[11px] text-stone-400">{advisory.note}</p>}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
