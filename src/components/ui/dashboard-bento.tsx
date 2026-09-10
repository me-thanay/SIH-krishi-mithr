"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Award,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Moon,
  Power,
  Settings,
  Shield,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export type DashboardSensor = {
  temperature?: number | null
  humidity?: number | null
  soil_moisture?: number | null
  rain_status?: string | null
  CO2_ppm?: number | null
  NH3_ppm?: number | null
  Benzene_ppm?: number | null
  Smoke_ppm?: number | null
  TDS?: number | null
  water_quality?: string | null
  light?: number | null
  light_status?: string | null
  motion_detected?: boolean | null
  motor_state?: string | null
  motor_on?: boolean | null
  air_quality_status?: string
  timestamp?: string
}

export type DashboardRecommendation = {
  type: string
  icon: LucideIcon
  title: string
  message: string
  action?: string
}

export type DashboardMarket = {
  crop: string
  min_price: number
  max_price: number
  trend: string
  recommendation: string
}

export type DashboardSubsidy = {
  scheme: string
  amount: string
  eligibility: boolean
  description: string
}

type DashboardBentoProps = {
  sensorData: DashboardSensor | null
  historyData: DashboardSensor[]
  marketData: DashboardMarket[]
  subsidies: DashboardSubsidy[]
  connectionStatus: "connected" | "disconnected" | "checking"
  dataUpdated: boolean
  relayLoading: string | null
  onRelayCommand: (command: string) => void
  recommendations: DashboardRecommendation[]
}

function Ring({
  size = "lg",
  children,
}: {
  size?: "sm" | "lg"
  children: ReactNode
}) {
  const box = size === "lg" ? "size-32" : "size-12"
  const iconWrap = size === "lg" ? "m-auto" : "m-auto"
  return (
    <div
      className={`relative mx-auto flex aspect-square ${box} rounded-full border before:absolute before:-inset-2 before:rounded-full before:border`}
    >
      <div className={iconWrap}>{children}</div>
    </div>
  )
}

function valueOrDash(value: number | string | null | undefined, suffix = "") {
  if (value === null || value === undefined || value === "") return "--"
  return `${value}${suffix}`
}

function isRaining(status?: string | null) {
  return status === "1" || status === "true"
}

function fieldScore(sensor: DashboardSensor) {
  const parts: number[] = []
  if (sensor.soil_moisture !== null && sensor.soil_moisture !== undefined) {
    parts.push(
      sensor.soil_moisture >= 30 && sensor.soil_moisture <= 70 ? 100 : 55
    )
  }
  if (sensor.air_quality_status === "good") parts.push(100)
  else if (sensor.air_quality_status === "poor") parts.push(40)
  if (sensor.water_quality) {
    parts.push(
      sensor.water_quality.includes("Safe") || sensor.water_quality.includes("Tap")
        ? 100
        : 60
    )
  }
  if (!parts.length) return null
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
}

export function DashboardBento({
  sensorData,
  historyData,
  marketData,
  subsidies,
  connectionStatus,
  dataUpdated,
  relayLoading,
  onRelayCommand,
  recommendations,
}: DashboardBentoProps) {
  const raining = isRaining(sensorData?.rain_status)
  const score = sensorData ? fieldScore(sensorData) : null
  const hero = sensorData?.soil_moisture ?? score
  const lastUpdate = sensorData?.timestamp
    ? new Date(sensorData.timestamp).toLocaleTimeString()
    : null

  return (
    <section className="min-h-screen bg-gray-50 py-16 md:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:max-w-5xl">
        <div className="relative z-10 grid grid-cols-6 gap-3">
          {!sensorData ? (
            <Card className="relative col-span-full overflow-hidden">
              <CardContent className="py-16 text-center pt-6">
                <Ring>
                  <Activity className="size-12 text-primary" strokeWidth={1} />
                </Ring>
                <h2 className="mt-8 text-3xl font-semibold">Waiting for data</h2>
                <p className="mt-2 text-foreground">
                  MQTT readings will appear here as soon as the field device publishes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
                <CardContent className="relative m-auto size-fit pt-6">
                  <div className="relative flex h-24 w-56 items-center">
                    <span className="mx-auto block w-fit text-5xl font-semibold">
                      {hero === null || hero === undefined ? "--" : `${hero}%`}
                    </span>
                  </div>
                  <h2 className="mt-6 text-center text-3xl font-semibold">
                    Field health
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Soil moisture {valueOrDash(sensorData.soil_moisture, "%")}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <Ring>
                    <Shield className="m-auto size-12 text-primary" strokeWidth={1} />
                  </Ring>
                  <div className="relative z-10 mt-6 space-y-2 text-center">
                    <h2 className="text-lg font-medium transition">
                      {connectionStatus === "connected" ? "Device online" : "Device offline"}
                    </h2>
                    <p className="text-foreground">
                      {connectionStatus === "connected"
                        ? "Live MQTT monitoring is streaming from your field device."
                        : "Showing the last known reading until the device reconnects."}
                    </p>
                    {lastUpdate && (
                      <p className="text-xs text-muted-foreground">
                        Updated {lastUpdate}
                        {dataUpdated ? " · new data" : ""}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex justify-center pt-6">
                    <Zap className="size-16 text-primary" strokeWidth={1} />
                  </div>
                  <div className="relative z-10 mt-14 space-y-2 text-center">
                    <h2 className="text-lg font-medium transition">
                      {sensorData.motor_on ? "Irrigation on" : "Irrigation off"}
                    </h2>
                    <p className="text-foreground">
                      {sensorData.motor_on
                        ? "The pump is running. Monitor soil moisture before you shut it off."
                        : "Start the pump from the controls below when the field needs water."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                <CardContent className="grid pt-6 sm:grid-cols-2">
                  <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                    <Ring size="sm">
                      <Thermometer className="m-auto size-5" strokeWidth={1} />
                    </Ring>
                    <div className="space-y-2">
                      <h2 className="text-lg font-medium text-zinc-800 transition">
                        Environment
                      </h2>
                      <p className="text-foreground">
                        Temperature, humidity, and rain from the field sensors.
                      </p>
                    </div>
                  </div>
                  <div className="relative -mb-6 -mr-6 mt-6 h-fit rounded-tl-lg border-l border-t p-6 py-6 sm:ml-6">
                    <div className="absolute left-3 top-2 flex gap-1">
                      <span className="block size-2 rounded-full border bg-red-400" />
                      <span className="block size-2 rounded-full border bg-yellow-400" />
                      <span className="block size-2 rounded-full border bg-green-400" />
                    </div>
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                        <p className="text-3xl font-semibold">
                          {valueOrDash(sensorData.temperature, "°C")}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                          <p className="font-medium">{valueOrDash(sensorData.humidity, "%")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rain</p>
                          <p className="font-medium">{raining ? "Raining" : "Clear"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                  <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                    <Ring size="sm">
                      <Gauge className="m-auto size-6" strokeWidth={1} />
                    </Ring>
                    <div className="space-y-2">
                      <h2 className="text-lg font-medium transition">Live readings</h2>
                      <p className="text-foreground">
                        Air, water, light, and motion stay in sync with the hardware.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px before:bg-border sm:-my-6 sm:-mr-6">
                    <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                      <ReadingRow
                        align="end"
                        label="Air"
                        value={sensorData.air_quality_status === "poor" ? "Poor" : sensorData.air_quality_status === "good" ? "Good" : "--"}
                      />
                      <ReadingRow
                        align="start"
                        label="Water"
                        value={sensorData.water_quality ?? "--"}
                      />
                      <ReadingRow
                        align="end"
                        label="Light"
                        value={sensorData.light_status ?? (sensorData.light === 0 ? "Day" : "--")}
                      />
                      <ReadingRow
                        align="start"
                        label="Motion"
                        value={sensorData.motion_detected ? "Detected" : "None"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <Ring>
                    <Wind className="m-auto size-12 text-primary" strokeWidth={1} />
                  </Ring>
                  <div className="relative z-10 mt-6 space-y-2 text-center">
                    <h2 className="text-lg font-medium">Air quality</h2>
                    <p className="text-3xl font-semibold">
                      {valueOrDash(sensorData.CO2_ppm)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CO₂ ppm · NH₃ {valueOrDash(sensorData.NH3_ppm)} · Smoke {valueOrDash(sensorData.Smoke_ppm)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex justify-center pt-6">
                    {sensorData.light === 0 ? (
                      <Sun className="size-16 text-primary" strokeWidth={1} />
                    ) : (
                      <Moon className="size-16 text-primary" strokeWidth={1} />
                    )}
                  </div>
                  <div className="relative z-10 mt-14 space-y-2 text-center">
                    <h2 className="text-lg font-medium">Light status</h2>
                    <p className="text-foreground">
                      {sensorData.light_status ?? "Waiting for the next light reading."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden lg:col-span-2">
                <CardContent className="pt-6">
                  <Ring>
                    <Eye className="m-auto size-12 text-primary" strokeWidth={1} />
                  </Ring>
                  <div className="relative z-10 mt-6 space-y-2 text-center">
                    <h2 className="text-lg font-medium">Field motion</h2>
                    <p className="text-foreground">
                      {sensorData.motion_detected
                        ? "Movement detected in the field area."
                        : "No motion detected right now."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative col-span-full overflow-hidden">
                <CardContent className="grid gap-8 pt-6 md:grid-cols-3">
                  <ControlCard
                    icon={Zap}
                    title="Irrigation motor"
                    subtitle="Relay 1 · Pump"
                    on={Boolean(sensorData.motor_on)}
                    loading={relayLoading === "motor:on" || relayLoading === "motor:off"}
                    onEnable={() => onRelayCommand("motor:on")}
                    onDisable={() => onRelayCommand("motor:off")}
                    enableDisabled={sensorData.motor_on === true}
                    disableDisabled={sensorData.motor_on !== true}
                  />
                  <ControlCard
                    icon={Power}
                    title="HV generator"
                    subtitle="Relay 2 · High voltage"
                    on={sensorData.motor_state === "true"}
                    loading={relayLoading === "hv:on" || relayLoading === "hv:off"}
                    onEnable={() => onRelayCommand("hv:on")}
                    onDisable={() => onRelayCommand("hv:off")}
                  />
                  <ControlCard
                    icon={Settings}
                    title="Auto mode"
                    subtitle="Motion-triggered"
                    on={sensorData.motor_state === "true"}
                    loading={relayLoading === "hv_auto:on" || relayLoading === "hv_auto:off"}
                    onEnable={() => onRelayCommand("hv_auto:on")}
                    onDisable={() => onRelayCommand("hv_auto:off")}
                    enableLabel="Enable auto"
                    disableLabel="Manual"
                  />
                </CardContent>
              </Card>

              {recommendations.length > 0 && (
                <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                  <CardContent className="grid pt-6 sm:grid-cols-1">
                    <div className="relative z-10 flex flex-col justify-between space-y-6">
                      <Ring size="sm">
                        <Droplets className="m-auto size-5" strokeWidth={1} />
                      </Ring>
                      <div className="space-y-2">
                        <h2 className="text-lg font-medium">Recommendations</h2>
                        <p className="text-foreground">
                          Advice based on the latest soil, weather, and air readings.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {recommendations.slice(0, 4).map((rec, index) => {
                          const Icon = rec.icon
                          return (
                            <div key={index} className="rounded-lg border px-3 py-2">
                              <p className="flex items-center gap-2 text-sm font-medium">
                                <Icon className="size-4 text-primary" />
                                {rec.title}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{rec.message}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className={`relative overflow-hidden ${recommendations.length > 0 ? "col-span-full lg:col-span-3" : "col-span-full"}`}>
                <CardContent className="pt-6">
                  <Ring size="sm">
                    <Award className="m-auto size-5" strokeWidth={1} />
                  </Ring>
                  <div className="mt-6 space-y-2">
                    <h2 className="text-lg font-medium">Available subsidies</h2>
                    <p className="text-foreground">
                      Schemes you can check without creating a profile.
                    </p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {subsidies.length === 0 && (
                      <p className="text-sm text-muted-foreground">No subsidy matches yet.</p>
                    )}
                    {subsidies.map((subsidy, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{subsidy.scheme}</p>
                          <p className="text-xs text-muted-foreground">{subsidy.description}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">{subsidy.amount}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {marketData.length > 0 && (
                <Card className="relative col-span-full overflow-hidden">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-medium">Market prices</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {marketData.map((market, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{market.crop}</p>
                            <span className="rounded-full border px-2 py-0.5 text-xs">{market.trend}</span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            ₹{market.min_price} – ₹{market.max_price} / quintal
                          </p>
                          <p className="mt-2 text-sm">{market.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {historyData.length > 0 && (
                <Card className="relative col-span-full overflow-hidden">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-medium">Recent readings</h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 font-medium">Time</th>
                            <th className="py-2 font-medium">Temp</th>
                            <th className="py-2 font-medium">Humidity</th>
                            <th className="py-2 font-medium">Soil</th>
                            <th className="py-2 font-medium">Motor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.map((row, index) => (
                            <tr key={index} className="border-b last:border-0">
                              <td className="py-2">
                                {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : "--"}
                              </td>
                              <td className="py-2">{valueOrDash(row.temperature, "°C")}</td>
                              <td className="py-2">{valueOrDash(row.humidity, "%")}</td>
                              <td className="py-2">{valueOrDash(row.soil_moisture, "%")}</td>
                              <td className="py-2">{row.motor_on ? "On" : "Off"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function ReadingRow({
  align,
  label,
  value,
}: {
  align: "start" | "end"
  label: string
  value: string
}) {
  const end = align === "end"
  return (
    <div
      className={`relative flex items-center gap-2 ${
        end ? "w-[calc(50%+0.875rem)] justify-end" : "ml-[calc(50%-1rem)]"
      }`}
    >
      {end ? (
        <>
          <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">
            {label}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border bg-background text-[10px] font-medium ring-4 ring-background">
            {value.slice(0, 4)}
          </span>
        </>
      ) : (
        <>
          <span className="flex size-8 items-center justify-center rounded-full border bg-background text-[10px] font-medium ring-4 ring-background">
            {value.slice(0, 4)}
          </span>
          <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">
            {label}
          </span>
        </>
      )}
    </div>
  )
}

function ControlCard({
  icon: Icon,
  title,
  subtitle,
  on,
  loading,
  onEnable,
  onDisable,
  enableDisabled,
  disableDisabled,
  enableLabel = "Turn on",
  disableLabel = "Turn off",
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  on: boolean
  loading: boolean
  onEnable: () => void
  onDisable: () => void
  enableDisabled?: boolean
  disableDisabled?: boolean
  enableLabel?: string
  disableLabel?: string
}) {
  return (
    <div className="space-y-6">
      <Ring size="sm">
        <Icon className="m-auto size-5" strokeWidth={1} />
      </Ring>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-4xl font-semibold">{loading ? "..." : on ? "ON" : "OFF"}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEnable}
          disabled={loading || enableDisabled}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enableLabel}
        </button>
        <button
          type="button"
          onClick={onDisable}
          disabled={loading || disableDisabled}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disableLabel}
        </button>
      </div>
    </div>
  )
}
