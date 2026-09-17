"use client"

import React, { useEffect, useState } from "react"
import { Bug, Camera, Droplets, Leaf, Loader2, RefreshCw } from "lucide-react"
import { Card } from "./card"

type Finding = { type?: string; name?: string; confidence?: number }
type Scan = {
  id?: string
  device_id?: string
  trigger?: string
  summary?: string
  certainty?: string
  advice?: string | null
  findings?: Finding[]
  annotated_image?: string | null
  timestamp?: string
}

export function CameraScanPanel({
  onFinding,
  pollMs = 15000,
}: {
  onFinding?: (notification: {
    title: string
    message: string
    type: "success" | "warning" | "danger" | "info"
  }) => void
  pollMs?: number
} = {}) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastIdRef = React.useRef<string | null>(null)

  const load = async () => {
    try {
      const response = await fetch("/api/camera-scan/latest")
      const json = await response.json()
      if (json.data) {
        setScan(json.data)
        setError(null)
        const id = String(json.data.id || json.data.timestamp || "")
        if (id && lastIdRef.current && id !== lastIdRef.current && json.data.findings?.length) {
          const top = json.data.findings[0]
          onFinding?.({
            title: "Camera scan",
            message: json.data.summary || top?.name || "New plant scan available",
            type:
              top?.type === "pest"
                ? "danger"
                : json.data.certainty === "low"
                  ? "warning"
                  : "info",
          })
        }
        if (id) lastIdRef.current = id
      } else {
        setScan(null)
      }
    } catch (err: any) {
      setError(err?.message || "Could not load camera scan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), pollMs)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs])

  const imageSrc = scan?.annotated_image
    ? `data:image/jpeg;base64,${scan.annotated_image}`
    : null

  return (
    <Card className="overflow-hidden border-2 border-green-100 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-green-700" />
          <div>
            <h2 className="text-sm font-semibold text-stone-800">ESP32-CAM last scan</h2>
            <p className="text-[11px] text-stone-500">
              {scan?.device_id || "esp32-cam"}
              {scan?.timestamp
                ? ` · ${new Date(scan.timestamp).toLocaleString()}`
                : " · waiting for first upload"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            void load()
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-xs text-stone-600 hover:bg-stone-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#122023]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="Last ESP32-CAM diagnose" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
              <Camera className="h-10 w-10" />
              <p className="px-4 text-center text-xs">
                Flash the ESP32-CAM sketch. It will POST stills to the diagnose API; results appear here.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
          {!scan && !loading && !error && (
            <p className="text-stone-500">No scans stored yet. Sensors keep working over MQTT as before.</p>
          )}
          {scan?.summary && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Summary</p>
              <p className="mt-1 text-stone-800">{scan.summary}</p>
              {scan.certainty && (
                <p className="mt-1 text-xs text-stone-500">Certainty: {scan.certainty}</p>
              )}
            </div>
          )}
          {scan?.findings && scan.findings.length > 0 && (
            <ul className="space-y-2">
              {scan.findings.slice(0, 5).map((finding, index) => (
                <li
                  key={`${finding.name}-${index}`}
                  className="flex items-start gap-2 rounded-xl bg-stone-50 px-3 py-2"
                >
                  {finding.type === "pest" ? (
                    <Bug className="mt-0.5 h-4 w-4 text-red-600" />
                  ) : finding.type === "deficiency" ? (
                    <Droplets className="mt-0.5 h-4 w-4 text-blue-700" />
                  ) : (
                    <Leaf className="mt-0.5 h-4 w-4 text-amber-700" />
                  )}
                  <div>
                    <p className="font-medium text-stone-800">{finding.name}</p>
                    <p className="text-xs text-stone-500">
                      {typeof finding.confidence === "number"
                        ? `${(finding.confidence * 100).toFixed(0)}%`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {scan?.advice && <p className="text-xs text-amber-800">{scan.advice}</p>}
        </div>
      </div>
    </Card>
  )
}
