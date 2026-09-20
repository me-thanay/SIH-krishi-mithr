"use client"

import React, { useEffect, useState } from "react"
import { Droplets, Activity, Bug, Power, TrendingUp, Sprout, Loader2, RefreshCw } from "lucide-react"
import { Card } from "./card"

type Head = {
  label?: string
  confidence?: number
  advice?: string
  value?: number
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

function Pill({
  icon,
  title,
  head,
}: {
  icon: React.ReactNode
  title: string
  head?: Head
}) {
  if (!head) return null
  const value =
    head.value != null
      ? `${head.value}/100`
      : `${head.label || "—"}${head.confidence != null ? ` (${Math.round(head.confidence * 100)}%)` : ""}`
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-3">
      <div className="flex items-center gap-2 text-stone-800">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-sm capitalize text-stone-700">{value}</p>
      {head.advice && <p className="mt-1 text-xs leading-relaxed text-stone-500">{head.advice}</p>}
    </div>
  )
}

function advisoryUrl(city: string) {
  const qs = `city=${encodeURIComponent(city)}`
  // Same-origin proxy avoids localtunnel/ngrok browser interstitial pages (511 HTML).
  return `/api/advisory/predict?${qs}`
}

function tunnelHeaders(): HeadersInit {
  const backend = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")
  const headers: Record<string, string> = { accept: "application/json" }
  if (/ngrok/i.test(backend)) headers["ngrok-skip-browser-warning"] = "true"
  if (/loca\.lt/i.test(backend)) headers["bypass-tunnel-reminder"] = "true"
  return headers
}

async function parseJsonSafe(response: Response) {
  const text = await response.text()
  if (!text) throw new Error(`Empty response (${response.status})`)
  try {
    return JSON.parse(text)
  } catch {
    if (text.trim().toLowerCase().startsWith("not found") || response.status === 404) {
      throw new Error(
        "Advisory API not found. Keep run_local_gpu.ps1 + named tunnel running, and set NEXT_PUBLIC_API_URL to https://krishi-mithr-api.loca.lt"
      )
    }
    if (/tunnel website ahead|loca\.lt|ngrok/i.test(text) || response.status === 511) {
      throw new Error(
        "Tunnel warning page blocked the request. Redeploy Vercel with latest main (proxy bypass), and keep the named tunnel running."
      )
    }
    throw new Error(`Bad response (${response.status}): ${text.slice(0, 120)}`)
  }
}

export function XgboostAdvisoryPanel({ city = "Hyderabad" }: { city?: string }) {
  const [data, setData] = useState<Advisory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(advisoryUrl(city), { headers: tunnelHeaders() })
      const json = await parseJsonSafe(response)
      if (!response.ok) {
        throw new Error(
          typeof json.detail === "string"
            ? json.detail
            : json.error || `Advisory failed (${response.status})`
        )
      }
      setData(json)
    } catch (err: any) {
      setError(err?.message || "Could not load XGBoost advisory")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 60_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  return (
    <Card className="border-2 border-emerald-100 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">XGBoost advisory</p>
          <h2 className="mt-1 text-lg font-semibold text-stone-800">Sensors + weather decisions</h2>
          <p className="mt-1 text-xs text-stone-500">
            {data?.inputs?.weather_city || city}
            {data?.inputs?.sensor_used ? " · using latest ESP sensors" : " · weather only (no sensor row yet)"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-xs text-stone-600 hover:bg-stone-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <p className="mt-1 text-xs text-red-600/80">
            Needs FastAPI /api/advisory/predict. Keep GPU API + named tunnel up; NEXT_PUBLIC_API_URL =
            https://krishi-mithr-api.loca.lt
          </p>
        </div>
      )}
      {data?.summary && <p className="mb-4 text-sm leading-relaxed text-stone-700">{data.summary}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Pill icon={<Droplets className="h-4 w-4 text-blue-600" />} title="Irrigation" head={data?.irrigation} />
        <Pill icon={<Activity className="h-4 w-4 text-amber-600" />} title="Crop stress" head={data?.stress_risk} />
        <Pill icon={<Bug className="h-4 w-4 text-red-600" />} title="Disease climate" head={data?.disease_climate_risk} />
        <Pill icon={<Power className="h-4 w-4 text-emerald-700" />} title="Motor / pump" head={data?.motor} />
        <Pill icon={<Sprout className="h-4 w-4 text-green-700" />} title="Growing score" head={data?.yield_score} />
        <Pill icon={<TrendingUp className="h-4 w-4 text-indigo-600" />} title="Price trend" head={data?.price_trend} />
      </div>

      {data?.note && <p className="mt-4 text-[11px] text-stone-400">{data.note}</p>}
    </Card>
  )
}
