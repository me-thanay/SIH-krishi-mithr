"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import mqtt, { MqttClient } from "mqtt"

// Use secure WebSocket for browsers (avoids mixed-content blocks on https)
const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt"
const TOPIC_PUB = "krishimithr/device/cmd"
const TOPIC_SUB = "krishimithr/sensor/data"

type SensorData = Record<string, string | number | boolean>

const fieldOrder: { key: string; label: string }[] = [
  { key: "temperature", label: "Temperature (°C)" },
  { key: "humidity", label: "Humidity (%)" },
  { key: "soilMoisture", label: "Soil Moisture" },
  { key: "raindata", label: "Rain Data" },
  { key: "rainStatus", label: "Rain Status" },
  { key: "motion", label: "Motion" },
  { key: "light", label: "Light" },
  { key: "tds_ppm", label: "TDS (ppm)" },
  { key: "waterStatus", label: "Water Status" },
  { key: "CO2_ppm", label: "CO₂ (ppm)" },
  { key: "NH3_ppm", label: "NH₃ (ppm)" },
  { key: "Benzene_ppm", label: "Benzene (ppm)" },
  { key: "Smoke_ppm", label: "Smoke (ppm)" },
  { key: "AirQuality", label: "Air Quality" },
  { key: "motor", label: "Motor" },
  { key: "hv", label: "HV" },
  { key: "hv_auto", label: "HV Auto" },
]

export default function IotDashboardPage() {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "reconnecting">("disconnected")
  const [sensorData, setSensorData] = useState<SensorData>({})
  const [backlog, setBacklog] = useState<string[]>([])
  const [lastPayload, setLastPayload] = useState<string>("")
  const [error, setError] = useState<string>("")
  const clientRef = useRef<MqttClient | null>(null)

  const connectionBadge = useMemo(() => {
    const map: Record<typeof status, { text: string; color: string }> = {
      disconnected: { text: "Disconnected", color: "bg-red-100 text-red-700 border-red-200" },
      connecting: { text: "Connecting...", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      reconnecting: { text: "Reconnecting...", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      connected: { text: "Connected", color: "bg-green-100 text-green-700 border-green-200" },
    }
    return map[status]
  }, [status])

  useEffect(() => {
    setStatus("connecting")
    const client = mqtt.connect(BROKER_URL, {
      clientId: `krishi-mithr-web-${Math.random().toString(16).slice(2)}`,
      keepalive: 60,
      reconnectPeriod: 3_000,
    })

    clientRef.current = client

    client.on("connect", () => {
      setStatus("connected")
      client.subscribe(TOPIC_SUB, { qos: 0 }, (err) => {
        if (err) setError(`Subscribe error: ${err.message}`)
      })
    })

    client.on("reconnect", () => setStatus("reconnecting"))
    client.on("close", () => setStatus("disconnected"))
    client.on("error", (err) => setError(err.message))

    client.on("message", (_topic, payload) => {
      const text = payload.toString()
      setLastPayload(text)
      try {
        const data = JSON.parse(text) as Record<string, any>
        if (data?.backlog) {
          setBacklog((prev) => [text, ...prev].slice(0, 200))
          return
        }

        setSensorData((prev) => ({
          ...prev,
          ...data,
        }))
      } catch (e: any) {
        setError(`Parse error: ${e?.message || "invalid JSON"}`)
      }
    })

    return () => {
      client.end(true)
      clientRef.current = null
    }
  }, [])

  const sendCmd = (cmd: string) => {
    if (!clientRef.current || status !== "connected") {
      setError("Not connected to broker")
      return
    }
    clientRef.current.publish(TOPIC_PUB, cmd, { qos: 0 }, (err) => {
      if (err) {
        setError(`Publish failed: ${err.message}`)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Krishi Mithr IoT Dashboard</h1>
            <p className="text-gray-600">Live MQTT feed and controls (HiveMQ public broker)</p>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${connectionBadge.color}`}>
            {connectionBadge.text}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fieldOrder.map(({ key, label }) => {
                const raw = sensorData[key]
                let display = raw === undefined ? "--" : String(raw)

                if (key === "light") {
                  const normalized = display.toLowerCase()
                  if (normalized === "light") display = "🌞 Light detected"
                  if (normalized === "dark") display = "🌙 Dark detected"
                }

                if (key === "waterStatus") {
                  // keep raw text, color handled below
                }

                const isOn = String(raw).toLowerCase() === "true"
                const isStatusField = key === "motor" || key === "hv" || key === "hv_auto"

                const valueColor =
                  key === "waterStatus"
                    ? /Safe|Tap/i.test(display)
                      ? "text-green-700"
                      : /Fertilizer|High TDS/i.test(display)
                        ? "text-red-700"
                        : "text-gray-800"
                    : isStatusField
                      ? isOn
                        ? "text-green-700"
                        : "text-gray-700"
                      : "text-gray-800"

                return (
                  <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">{label}</div>
                    <div className={`text-xl font-semibold ${valueColor}`}>
                      {display}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold">Controls</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Motor (Relay 1)</div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-green-600 text-white px-3 py-2 hover:bg-green-700"
                      onClick={() => sendCmd("motor:on")}
                    >
                      ON
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
                      onClick={() => sendCmd("motor:off")}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">HV Generator (Relay 2)</div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-green-600 text-white px-3 py-2 hover:bg-green-700"
                      onClick={() => sendCmd("hv:on")}
                    >
                      ON
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
                      onClick={() => sendCmd("hv:off")}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">HV Auto mode</div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-green-600 text-white px-3 py-2 hover:bg-green-700"
                      onClick={() => sendCmd("hv_auto:on")}
                    >
                      AUTO ON
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
                      onClick={() => sendCmd("hv_auto:off")}
                    >
                      AUTO OFF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Last Payload</h2>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto min-h-[140px]">
                {lastPayload || "Waiting for data..."}
              </pre>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Backlog (from flash)</h2>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-y-auto max-h-64 space-y-2">
                {backlog.length === 0 ? (
                  <div className="text-gray-500">No backlog yet.</div>
                ) : (
                  backlog.map((entry, idx) => (
                    <pre key={idx} className="whitespace-pre-wrap">
                      {entry}
                    </pre>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

