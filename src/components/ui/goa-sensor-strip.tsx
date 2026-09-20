"use client"

import React, { useEffect, useState } from "react"
import { Activity, Droplets, Thermometer, Waves } from "lucide-react"
import { Card } from "./card"

type SensorRow = {
  temperature?: number
  humidity?: number
  soil_moisture?: number
  soilMoisture?: number
  TDS?: number
  tds_ppm?: number
  motor?: boolean | number | string | null
  motor_on?: boolean | number | string | null
  timestamp?: string
}

function isFakeDemoRow(data: SensorRow | null): boolean {
  if (!data) return false
  return (
    Number(data.temperature) === 34 &&
    Number(data.humidity) === 68 &&
    Number(data.soil_moisture ?? data.soilMoisture) === 18 &&
    Number(data.TDS ?? data.tds_ppm) === 950
  )
}

export function GoaSensorStrip() {
  const [data, setData] = useState<SensorRow | null>(null)
  const [source, setSource] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const r = await fetch("/api/sensor-data/latest")
      const j = await r.json()
      if (j?.mock || isFakeDemoRow(j?.data)) {
        setData(null)
        setSource("")
        setError("Demo numbers blocked. Waiting for real ESP32 MQTT…")
        return
      }
      if (j?.data) {
        setData(j.data)
        setSource(j.source || "esp32")
        setError(null)
      } else {
        setData(null)
        setSource("")
        setError(j?.message || "Waiting for Goa ESP32 MQTT publish…")
      }
    } catch {
      setError("Sensor API unreachable")
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 5000)
    return () => clearInterval(t)
  }, [])

  const soil = data?.soil_moisture ?? data?.soilMoisture
  const tds = data?.TDS ?? data?.tds_ppm
  const motorOn = (() => {
    const raw: unknown = data?.motor_on ?? data?.motor
    if (raw === true || raw === 1) return true
    if (raw === false || raw === 0 || raw == null) return false
    if (typeof raw === "string") {
      const s = raw.trim().toLowerCase()
      if (["true", "1", "on", "yes"].includes(s)) return true
      if (["false", "0", "off", "no", ""].includes(s)) return false
    }
    return Boolean(raw)
  })()

  return (
    <Card className="border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Goa ESP32 sensors</p>
          <p className="text-sm text-stone-600">
            MQTT <code className="text-xs">krishimithr/sensor/data</code>
            {source ? ` · ${source}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
        >
          Refresh
        </button>
      </div>

      {error && !data && <p className="text-sm text-amber-700">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Thermometer className="h-3.5 w-3.5" /> Temp
            </div>
            <p className="mt-0.5 text-sm font-semibold text-stone-800">
              {data.temperature != null ? `${Number(data.temperature).toFixed(1)}°C` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Droplets className="h-3.5 w-3.5" /> Humidity
            </div>
            <p className="mt-0.5 text-sm font-semibold text-stone-800">
              {data.humidity != null ? `${Number(data.humidity).toFixed(0)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Waves className="h-3.5 w-3.5" /> Soil
            </div>
            <p className="mt-0.5 text-sm font-semibold text-stone-800">
              {soil != null ? `${Number(soil).toFixed(0)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Activity className="h-3.5 w-3.5" /> TDS / Motor
            </div>
            <p className="mt-0.5 text-sm font-semibold text-stone-800">
              {tds != null ? `${Number(tds).toFixed(0)} ppm` : "—"}
              {" · "}
              {motorOn ? "ON" : "OFF"}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
