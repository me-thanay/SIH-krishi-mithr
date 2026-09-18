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
  models?: { detector?: string | null; leaf_classifier?: string | null; pest_classifier?: string | null }
  error?: string
  detail?: string
}

export default function PestDetectionDemo() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const setImageFile = (next: File) => {
    setFile(next)
    setReport(null)
    setError("")
    setPreview(URL.createObjectURL(next))
  }

  const startCamera = async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })
      streamRef.current = stream
      setCameraOn(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError("Camera permission was denied. Upload a photo instead.")
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      setImageFile(new File([blob], "camera.jpg", { type: "image/jpeg" }))
      stopCamera()
    }, "image/jpeg", 0.92)
  }

  const diagnose = async () => {
    if (!file) {
      setError("Take or upload a photo of a leaf first.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const body = new FormData()
      body.append("file", file)
      // Prefer the FastAPI URL directly so Vercel is not limited by serverless timeouts.
      const backend = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")
      const url = backend
        ? `${backend}/api/pest/diagnose?annotate=true&top_k=3`
        : "/api/pest/diagnose?annotate=true&top_k=3"
      const response = await fetch(url, {
        method: "POST",
        body,
      })
      const data = (await response.json()) as Report
      if (!response.ok) {
        setError(data.detail || data.error || "Diagnosis failed")
        return
      }
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the diagnosis service")
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
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#122023]/50">Krishi Mithr</p>
        <h1 className="mt-2 font-kanturmuy text-4xl tracking-tight sm:text-5xl">Camera: YOLO then EfficientNet</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#122023]/70 sm:text-base">
          YOLO finds leaves and insects. EfficientNetV2-S names the disease (and maize deficiency) on each leaf
          crop, and the pest species on each insect box. Sensors and XGBoost stay on the dashboard — this page
          is camera vision only. Use a clear shot of one leaf or insect filling the frame.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(18,32,35,0.08)]">
            <div className="relative aspect-[4/3] bg-[#122023]">
              {cameraOn ? (
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
              ) : annotatedSrc ? (
                <img src={annotatedSrc} alt="Leaf photo" className="h-full w-full object-contain bg-[#122023]" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
                  <ScanSearch className="h-12 w-12" />
                  <p className="text-sm">Camera or upload a leaf photo</p>
                </div>
              )}
              {(preview || cameraOn) && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera()
                    setPreview(null)
                    setFile(null)
                    setReport(null)
                  }}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white"
                  aria-label="Clear photo"
                >
                  <X className="h-4 w-4" />
                </button>
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
                  onClick={() => void startCamera()}
                  className="inline-flex items-center gap-2 rounded-full border border-[#122023]/15 px-4 py-2.5 text-sm"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </button>
              )}
              <button
                type="button"
                disabled={loading || !file}
                onClick={() => void diagnose()}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#122023] px-5 py-2.5 text-sm font-medium text-[#e1fcad] disabled:cursor-not-allowed disabled:bg-[#d7d3c8] disabled:text-[#122023]/40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {loading ? "Locating regions..." : "Diagnose"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(18,32,35,0.08)]">
            {!report ? (
              <div className="flex h-full min-h-[280px] flex-col justify-center text-[#122023]/60">
                <p className="text-sm">Results appear here after YOLO boxes the leaf or insect.</p>
              </div>
            ) : (
              <div className="space-y-5">
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
                            ? ` — ${leaf.diagnosis.plant} / ${leaf.diagnosis.disease} (${((leaf.diagnosis.confidence || 0) * 100).toFixed(0)}%)`
                            : leaf.too_small
                              ? " — too small to diagnose"
                              : ""}
                          {leaf.deficiency?.suspected_deficiency
                            ? ` — suspected ${leaf.deficiency.suspected_deficiency} (${((leaf.deficiency.confidence || 0) * 100).toFixed(0)}%)`
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
