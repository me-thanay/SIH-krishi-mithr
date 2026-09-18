import React, { useEffect, useRef, useState } from "react"
import { Bug, Camera, Droplets, Leaf, Loader2, ScanSearch, Upload, X } from "lucide-react"
import { NewNavbar } from "@/components/ui/new-navbar"

type Finding = { type: string; name: string; confidence: number; box: number[] }
type Diagnosis = {
  plant?: string
  disease?: string
  healthy?: boolean
  confidence?: number
  top_k?: { plant?: string; disease?: string; confidence: number }[]
}
type LeafRegion = {
  box: number[]
  det_confidence: number
  too_small?: boolean
  diagnosis?: Diagnosis | null
  deficiency?: {
    crop?: string
    suspected_deficiency?: string | null
    healthy?: boolean
    confidence?: number
  } | null
}
type PestRegion = {
  box: number[]
  det_confidence: number
  species?: string | null
  confidence: number
}
type Report = {
  summary?: string
  certainty?: string
  advice?: string | null
  findings?: Finding[]
  leaves?: LeafRegion[]
  pests?: PestRegion[]
  fallback?: { source?: string; diagnosis?: Diagnosis } | null
  annotated_image?: string
  pipeline?: {
    mode?: string
    description?: string
    stages?: {
      id: string
      name: string
      role: string
      model?: string | null
      leaf_boxes?: number
      pest_boxes?: number
      leaves_classified?: number
      pests_identified?: number
    }[]
  }
  models?: { detector?: string | null; leaf_classifier?: string | null; pest_classifier?: string | null }
  error?: string
  detail?: string
}

function renderApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").trim()
  if (!raw) return ""
  let url = raw.replace(/\/$/, "")
  if (url.startsWith("http://") && /(onrender\.com|ngrok|trycloudflare\.com|cloudflaretunnel)/i.test(url)) {
    url = url.replace(/^http:\/\//i, "https://")
  }
  return url
}

function isTunnelHost(url: string): boolean {
  return /(ngrok|trycloudflare\.com|cloudflaretunnel|loca\.lt)/i.test(url)
}

/** Headers needed for free ngrok interstitial + JSON APIs. */
function apiFetchHeaders(extra?: HeadersInit): HeadersInit {
  const backend = renderApiBase()
  const headers: Record<string, string> = { accept: "application/json" }
  if (backend && /ngrok/i.test(backend)) {
    headers["ngrok-skip-browser-warning"] = "true"
  }
  return { ...headers, ...(extra as Record<string, string> | undefined) }
}

/**
 * Prefer direct backend (Render or PC tunnel) so Vercel 60s limits don't kill GPU diagnose.
 * Same-origin proxy is the fallback.
 */
function diagnoseCandidates(): string[] {
  const backend = renderApiBase()
  const proxy = "/api/pest/diagnose?annotate=true&top_k=3"
  const direct = backend ? `${backend}/api/pest/diagnose?annotate=true&top_k=3` : ""
  if (direct && isTunnelHost(direct)) return [direct, proxy]
  if (direct) return [direct, proxy]
  return [proxy]
}

function warmupUrl(): string {
  const backend = renderApiBase()
  if (backend) return `${backend}/api/pest/warmup`
  return "/api/pest/warmup"
}

async function openCameraStream(): Promise<MediaStream> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API is not available in this browser.")
  }
  // Secure context required (https or localhost)
  if (!window.isSecureContext) {
    throw new Error("Camera needs HTTPS (or localhost). Open the site over https and try again.")
  }

  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: { facingMode: { ideal: "user" } }, audio: false },
    { video: true, audio: false },
  ]

  let lastError: unknown
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }
  const name = lastError instanceof DOMException ? lastError.name : ""
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    throw new Error("Camera permission was denied. Allow camera access or use Upload.")
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    throw new Error("No camera was found on this device. Use Upload instead.")
  }
  throw new Error("Could not start the camera. Try Upload, or another browser/device.")
}

export default function PestDetectionDemo() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOn(false)
    setCameraStarting(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attach stream AFTER the <video> element is mounted (cameraOn flip).
  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!cameraOn || !video || !stream) return

    video.srcObject = stream
    const play = async () => {
      try {
        await video.play()
      } catch {
        // Autoplay can fail until a user gesture; Capture still works once frames arrive.
      }
    }
    void play()
  }, [cameraOn])

  const clearPhoto = () => {
    stopCamera()
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreview(null)
    setFile(null)
    setReport(null)
    setError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const setImageFile = (next: File) => {
    stopCamera()
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const url = URL.createObjectURL(next)
    previewUrlRef.current = url
    setFile(next)
    setReport(null)
    setError("")
    setPreview(url)
  }

  const startCamera = async () => {
    setError("")
    setCameraStarting(true)
    try {
      // Replace any previous stream / preview
      stopCamera()
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setPreview(null)
      setFile(null)
      setReport(null)

      const stream = await openCameraStream()
      streamRef.current = stream
      setCameraOn(true) // mounts <video>; effect attaches stream
    } catch (err) {
      stopCamera()
      setError(err instanceof Error ? err.message : "Could not start the camera. Use Upload instead.")
    } finally {
      setCameraStarting(false)
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) {
      setError("Camera preview is not ready yet. Wait a second and tap Capture again.")
      return
    }
    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) {
      setError("Camera is still starting. Wait until you see the live preview, then Capture.")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture a frame. Try again or use Upload.")
          return
        }
        setImageFile(new File([blob], "camera.jpg", { type: "image/jpeg" }))
      },
      "image/jpeg",
      0.92
    )
  }

  // Wake GPU/tunnel backend and preload models while the user frames the leaf.
  useEffect(() => {
    const url = warmupUrl()
    const controller = new AbortController()
    void fetch(url, { method: "GET", headers: apiFetchHeaders(), signal: controller.signal }).catch(() => {})
    return () => controller.abort()
  }, [])

  const diagnose = async () => {
    if (!file) {
      setError("Take or upload a photo of a leaf first.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const urls = diagnoseCandidates()
      let response: Response | null = null
      let text = ""
      let lastNetworkError: Error | null = null

      for (const url of urls) {
        const body = new FormData()
        body.append("file", file)
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 180_000)
        try {
          response = await fetch(url, {
            method: "POST",
            body,
            headers: apiFetchHeaders(),
            signal: controller.signal,
          })
          text = await response.text()
          if (response.status === 502 || response.status === 504) {
            lastNetworkError = new Error(`Gateway ${response.status} from ${url}`)
            continue
          }
          break
        } catch (err) {
          lastNetworkError = err instanceof Error ? err : new Error(String(err))
          response = null
        } finally {
          window.clearTimeout(timeout)
        }
      }

      if (!response) {
        throw lastNetworkError || new Error("Could not reach diagnosis service")
      }

      let data: Report
      try {
        data = JSON.parse(text) as Report
      } catch {
        if (response.status === 502 || response.status === 504) {
          throw new Error(
            "Diagnose gateway timed out. If using your PC: keep run_local_gpu.ps1 + tunnel open, set NEXT_PUBLIC_API_URL to the tunnel HTTPS URL, redeploy Vercel."
          )
        }
        throw new Error(
          response.status === 404 || /not found/i.test(text)
            ? "Diagnosis API not found. Set NEXT_PUBLIC_API_URL to your tunnel or Render HTTPS URL and redeploy Vercel."
            : `Bad response from server (${response.status}). Check tunnel /health and Vercel NEXT_PUBLIC_API_URL.`
        )
      }
      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : data.error || (data as { success?: boolean }).success === false
              ? (data as { error?: string }).error
              : "Diagnosis failed"
        setError(detail || "Diagnosis failed")
        return
      }
      setReport(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Diagnosis timed out (3 min). Keep scripts/run_local_gpu.ps1 and the tunnel running, open /health, retry."
        )
      } else if (err instanceof TypeError || (err instanceof Error && /failed to fetch/i.test(err.message))) {
        setError(
          "Cannot reach the API. Start scripts/run_local_gpu.ps1 + a tunnel, set Vercel NEXT_PUBLIC_API_URL to that https URL, redeploy."
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach the diagnosis service. Check NEXT_PUBLIC_API_URL and that the tunnel is up."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const annotatedSrc = report?.annotated_image
    ? `data:image/jpeg;base64,${report.annotated_image}`
    : preview

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#122023]">
      <NewNavbar variant="solid" />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/50">Camera vision only</p>
        <h1 className="mt-2 font-kanturmuy text-4xl tracking-tight sm:text-5xl">YOLO finds it. EfficientNet names it.</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#122023]/70 sm:text-base">
          Phone or ESP32-CAM photo only — no sensors here. YOLO draws leaf and insect boxes; EfficientNetV2-S
          classifies each leaf crop for plant disease (and maize deficiency). Keep one leaf filling the frame.
        </p>

        <ol className="mt-6 flex flex-wrap gap-3 text-xs text-[#122023]/70">
          <li className="rounded-full bg-white px-3 py-1.5 shadow-sm">1. Camera capture</li>
          <li className="rounded-full bg-white px-3 py-1.5 shadow-sm">2. YOLO locate boxes</li>
          <li className="rounded-full bg-white px-3 py-1.5 shadow-sm">3. EfficientNet classify leaf</li>
        </ol>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(18,32,35,0.08)]">
            <div className="relative aspect-[4/3] bg-[#122023]">
              {cameraOn ? (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              ) : annotatedSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={annotatedSrc} alt="Leaf photo" className="h-full w-full object-contain bg-[#122023]" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
                  <Camera className="h-12 w-12" />
                  <p className="text-sm">Tap Camera for a live preview, or Upload a leaf photo</p>
                </div>
              )}
              {(preview || cameraOn) && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white"
                  aria-label="Clear photo"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {cameraOn && (
                <p className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  Live camera — tap Capture when ready
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const next = event.target.files?.[0]
                  if (next) setImageFile(next)
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-[#122023]/15 px-4 py-2.5 text-sm"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              {cameraOn ? (
                <button
                  type="button"
                  onClick={capture}
                  className="inline-flex items-center gap-2 rounded-full bg-[#e1fcad] px-4 py-2.5 text-sm font-medium"
                >
                  <Camera className="h-4 w-4" />
                  Capture
                </button>
              ) : (
                <button
                  type="button"
                  disabled={cameraStarting}
                  onClick={() => void startCamera()}
                  className="inline-flex items-center gap-2 rounded-full border border-[#122023]/15 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {cameraStarting ? "Starting..." : "Camera"}
                </button>
              )}
              <button
                type="button"
                disabled={loading || !file}
                onClick={() => void diagnose()}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#122023] px-5 py-2.5 text-sm font-medium text-[#e1fcad] disabled:cursor-not-allowed disabled:bg-[#d7d3c8] disabled:text-[#122023]/40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {loading ? "YOLO locating, then EfficientNet..." : "Diagnose"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(18,32,35,0.08)]">
            {!report ? (
              <div className="flex h-full min-h-[280px] flex-col justify-center gap-3 text-[#122023]/60">
                <p className="text-sm">Take or upload a leaf photo, then Diagnose.</p>
                <p className="text-xs">Stage 1: YOLO boxes · Stage 2: EfficientNet disease / deficiency</p>
              </div>
            ) : (
              <div className="space-y-5">
                {report.pipeline?.stages && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/45">Camera pipeline</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {report.pipeline.stages.map((stage) => (
                        <li key={stage.id} className="rounded-2xl bg-[#f6f4ee] px-3 py-2">
                          <p className="font-medium">{stage.name}</p>
                          <p className="text-xs text-[#122023]/55">{stage.role}</p>
                          <p className="mt-1 text-xs text-[#122023]/45">
                            {stage.model || "unavailable"}
                            {stage.leaf_boxes != null ? ` · ${stage.leaf_boxes} leaf box(es)` : ""}
                            {stage.pest_boxes != null ? ` · ${stage.pest_boxes} pest box(es)` : ""}
                            {stage.leaves_classified != null ? ` · ${stage.leaves_classified} classified` : ""}
                            {stage.pests_identified != null ? ` · ${stage.pests_identified} named` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/45">Summary</p>
                  <p className="mt-2 text-lg leading-snug">{report.summary}</p>
                  {report.certainty && (
                    <p className="mt-2 text-sm text-[#122023]/55">Certainty: {report.certainty}</p>
                  )}
                </div>

                {report.findings && report.findings.length > 0 && (
                  <div className="space-y-2">
                    {report.findings.map((finding, index) => (
                      <div
                        key={`${finding.name}-${index}`}
                        className="flex items-start gap-3 rounded-2xl bg-[#f6f4ee] px-4 py-3"
                      >
                        {finding.type === "pest" ? (
                          <Bug className="mt-0.5 h-5 w-5 text-red-600" />
                        ) : finding.type === "deficiency" ? (
                          <Droplets className="mt-0.5 h-5 w-5 text-blue-700" />
                        ) : (
                          <Leaf className="mt-0.5 h-5 w-5 text-amber-700" />
                        )}
                        <div>
                          <p className="font-medium">{finding.name}</p>
                          <p className="text-sm text-[#122023]/60">{(finding.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {report.leaves && report.leaves.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/45">Leaves located</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {report.leaves.map((leaf, index) => (
                        <li key={index}>
                          Leaf {index + 1} ({(leaf.det_confidence * 100).toFixed(0)}% box)
                          {leaf.diagnosis
                            ? ` — EfficientNet: ${leaf.diagnosis.plant} / ${leaf.diagnosis.disease} (${((leaf.diagnosis.confidence || 0) * 100).toFixed(0)}%)`
                            : leaf.too_small
                              ? " — too small for EfficientNet"
                              : ""}
                          {leaf.deficiency?.suspected_deficiency
                            ? ` — EfficientNet deficiency: ${leaf.deficiency.suspected_deficiency} (${((leaf.deficiency.confidence || 0) * 100).toFixed(0)}%)`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.pests && report.pests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/45">Pests located</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {report.pests.map((pest, index) => (
                        <li key={index}>
                          {pest.species || "insect pest"} ({(pest.confidence * 100).toFixed(0)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.advice && <p className="text-sm text-amber-800">{report.advice}</p>}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
