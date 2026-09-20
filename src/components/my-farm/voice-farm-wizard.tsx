"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mic, Square, Volume2, MapPin, Save, RotateCcw, Loader2, CheckCircle2, Pencil, Languages } from "lucide-react"
import {
  FARM_QUESTIONS,
  SUPPORTED_LANGUAGES,
  languageByCode,
  type Answers,
  type Answer,
  type DetectedLocation,
} from "@/lib/my-farm-schema"
import { beep, listenOnce, speak, speechSupported, stopSpeaking, VoiceAbort } from "@/lib/voice"

type Phase =
  | "idle"
  | "language"
  | "preparing"
  | "asking"
  | "listening"
  | "thinking"
  | "review"
  | "saving"
  | "done"
  | "error"

type Prompts = Record<string, string>

interface LogLine {
  who: "assistant" | "farmer" | "system"
  text: string
}

interface ReviewIntent {
  action: "confirm" | "edit" | "cancel" | "unclear" | string
  field_id: string | null
  new_value_transcript: string | null
  message: string
}

interface SavedField {
  id: string
  fieldName?: string | null
  crop?: string | null
  location?: { village?: string | null; district?: string | null; state?: string | null }
  area?: { value?: number | null; unit?: string | null }
  createdAt?: string
}

const ENGLISH_PROMPTS: Prompts = {
  welcome: "Great, we will continue in this language. I will ask a few questions about your field. Answer by speaking after the beep.",
  listening: "Listening",
  not_heard: "Sorry, I did not catch that. Please say it again.",
  unknown_ok: "No problem, we will leave that blank.",
  review_intro: "Here are the details you gave me.",
  confirm_ask: "Is everything correct? Say yes to save, or tell me what to change.",
  edit_which: "Which detail should I change?",
  saving: "Saving your field details.",
  saved: "Your field has been saved. Thank you.",
  save_failed: "Sorry, saving failed. Please try again.",
  location_found: "I found your location from GPS.",
  location_missing: "I could not detect your location automatically.",
}

function getClientId() {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("km_client_id")
  if (!id) {
    id = (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem("km_client_id", id)
  }
  return id
}

async function llm<T = any>(payload: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/my-farm/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `Assistant error (${r.status})`)
  return j as T
}

export function VoiceFarmWizard() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [language, setLanguage] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<Prompts>(ENGLISH_PROMPTS)
  const [questions, setQuestions] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Answers>({})
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [detected, setDetected] = useState<DetectedLocation | null>(null)
  const [locating, setLocating] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedField[]>([])
  const [support, setSupport] = useState({ tts: true, stt: true })

  // Mutable mirrors for the async conversation loop.
  const answersRef = useRef<Answers>({})
  const langRef = useRef<string>("en-IN")
  const promptsRef = useRef<Prompts>(ENGLISH_PROMPTS)
  const questionsRef = useRef<Record<string, string>>({})
  const detectedRef = useRef<DetectedLocation | null>(null)
  const runSignal = useRef<{ aborted: boolean; recognition?: any }>({ aborted: false })
  const logEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSupport(speechSupported())
    void loadSaved()
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [log, interim])

  const pushLog = useCallback((who: LogLine["who"], text: string) => {
    if (!text) return
    setLog((prev) => [...prev, { who, text }])
  }, [])

  const setAnswer = useCallback((id: string, a: Answer) => {
    answersRef.current = { ...answersRef.current, [id]: a }
    setAnswers(answersRef.current)
  }, [])

  const checkAbort = () => {
    if (runSignal.current.aborted) throw new VoiceAbort()
  }

  const say = async (text: string) => {
    checkAbort()
    pushLog("assistant", text)
    setPhase("asking")
    await speak(text, langRef.current, runSignal.current)
  }

  const hear = async (timeoutMs = 12_000): Promise<string | null> => {
    checkAbort()
    setInterim("")
    setPhase("listening")
    beep()
    try {
      const text = await listenOnce({
        lang: langRef.current,
        timeoutMs,
        signal: runSignal.current,
        onInterim: setInterim,
      })
      setInterim("")
      pushLog("farmer", text)
      return text
    } catch (e: any) {
      setInterim("")
      if (e instanceof VoiceAbort) throw e
      if (e?.message === "mic-denied") {
        throw new Error("Microphone permission was denied. Allow the mic in the browser and press Start again.")
      }
      if (e?.message === "unsupported") {
        throw new Error("This browser has no speech recognition. Use Chrome or Edge, or type the answers in the form.")
      }
      return null
    }
  }

  const think = <T,>(p: Promise<T>): Promise<T> => {
    setPhase("thinking")
    return p
  }

  // ---------- Location ----------
  const locate = useCallback(async (): Promise<DetectedLocation | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null
    setLocating(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 60_000,
        })
      )
      const base: DetectedLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }
      try {
        const r = await fetch(`/api/my-farm/geocode?lat=${base.lat}&lon=${base.lon}`)
        if (r.ok) {
          const j = await r.json()
          Object.assign(base, {
            village: j.village,
            district: j.district,
            state: j.state,
            country: j.country,
            display: j.display,
          })
        }
      } catch {
        /* keep coordinates only */
      }
      detectedRef.current = base
      setDetected(base)
      return base
    } catch {
      return null
    } finally {
      setLocating(false)
    }
  }, [])

  // ---------- Saved fields ----------
  const loadSaved = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const r = await fetch(`/api/my-farm/fields?clientId=${encodeURIComponent(getClientId())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (r.ok) {
        const j = await r.json()
        setSaved(j.fields || [])
      }
    } catch {
      /* ignore */
    }
  }

  // ---------- Conversation steps ----------
  const askLanguage = async (): Promise<string | null> => {
    setPhase("language")
    langRef.current = "en-IN"
    pushLog("assistant", "Which language would you like to speak in? Please say the language name.")
    await speak("Which language would you like to speak in? Please say the language name.", "en-IN", runSignal.current)
    await speak("आप किस भाषा में बात करना चाहेंगे? भाषा का नाम बोलिए।", "hi-IN", runSignal.current)
    for (let attempt = 0; attempt < 2; attempt++) {
      const heard = await hear(9_000)
      if (!heard) {
        if (attempt === 0) await speak("Please say the language name, for example Telugu, Hindi or English.", "en-IN", runSignal.current)
        continue
      }
      const out = await think(llm<{ code: string | null }>({ mode: "detect_language", transcript: heard }))
      if (out.code && SUPPORTED_LANGUAGES.some((l) => l.code === out.code)) return out.code
      await speak("Sorry, I did not get the language. Please say it again or tap it on the screen.", "en-IN", runSignal.current)
    }
    return null
  }

  const prepareLanguage = async (code: string) => {
    setPhase("preparing")
    langRef.current = code
    setLanguage(code)
    const out = await llm<{ questions: Record<string, string>; prompts: Prompts }>({
      mode: "translate_prompts",
      language: code,
    })
    questionsRef.current = out.questions || {}
    promptsRef.current = { ...ENGLISH_PROMPTS, ...(out.prompts || {}) }
    setQuestions(questionsRef.current)
    setPrompts(promptsRef.current)
  }

  const questionText = async (id: string): Promise<string> => {
    const q = FARM_QUESTIONS.find((x) => x.id === id)!
    const needsContext = (q.kind === "location" && detectedRef.current?.lat) || q.kind === "stage"
    if (needsContext) {
      try {
        const out = await think(
          llm<{ question: string }>({
            mode: "phrase_question",
            language: langRef.current,
            questionId: id,
            answers: answersRef.current,
            detected: detectedRef.current,
          })
        )
        if (out.question) return out.question
      } catch {
        /* fall back to static translation */
      }
    }
    return questionsRef.current[id] || q.question
  }

  const askQuestion = async (id: string, overrideTranscript?: string): Promise<void> => {
    const q = FARM_QUESTIONS.find((x) => x.id === id)!
    setCurrentId(id)
    let transcript: string | null = overrideTranscript ?? null
    if (!transcript) {
      const text = await questionText(id)
      if (q.kind === "location" && detectedRef.current?.lat) pushLog("system", promptsRef.current.location_found)
      await say(text)
    }

    for (let round = 0; round < 3; round++) {
      if (!transcript) {
        transcript = await hear()
        if (!transcript) {
          if (round === 2 && q.allowUnknown) {
            setAnswer(id, { value: null, display: "—", unknown: true, details: {}, transcript: "" })
            await say(promptsRef.current.unknown_ok)
            return
          }
          await say(promptsRef.current.not_heard)
          continue
        }
      }
      const out = await think(
        llm<{ ok: boolean; unknown: boolean; value: string | null; display: string; clarify: string | null; details: Record<string, unknown> }>({
          mode: "extract",
          language: langRef.current,
          questionId: id,
          transcript,
          answers: answersRef.current,
          detected: detectedRef.current,
        })
      )
      if (out.ok || out.unknown) {
        setAnswer(id, {
          value: out.unknown ? null : out.value ?? transcript,
          display: out.display || out.value || transcript,
          unknown: Boolean(out.unknown),
          details: out.details || {},
          transcript,
        })
        if (out.unknown) await say(promptsRef.current.unknown_ok)
        return
      }
      transcript = null
      await say(out.clarify || promptsRef.current.not_heard)
    }
    // Could not extract after 3 rounds: keep raw words so the farmer can fix it in review.
    setAnswer(id, { value: null, display: "—", unknown: q.allowUnknown ?? false, details: {}, transcript: "" })
  }

  const review = async (): Promise<"saved" | "cancelled"> => {
    for (let loops = 0; loops < 6; loops++) {
      setCurrentId(null)
      setPhase("review")
      const s = await think(
        llm<{ summary: string; question: string }>({ mode: "summary", language: langRef.current, answers: answersRef.current })
      )
      await say(promptsRef.current.review_intro)
      await say(s.summary)
      await say(s.question || promptsRef.current.confirm_ask)

      let intent: ReviewIntent | null = null
      for (let tries = 0; tries < 3 && !intent; tries++) {
        const heard = await hear(12_000)
        if (!heard) {
          await say(promptsRef.current.not_heard)
          continue
        }
        const out = await think(
          llm<ReviewIntent>({ mode: "review_intent", language: langRef.current, transcript: heard, answers: answersRef.current })
        )
        if (out && out.action !== "unclear") intent = out
        else if (out?.message) await say(out.message)
      }
      if (!intent) {
        setPhase("review")
        return "cancelled"
      }
      if (intent.action === "confirm") {
        await saveField()
        return "saved"
      }
      if (intent.action === "cancel") {
        if (intent.message) await say(intent.message)
        return "cancelled"
      }
      // edit
      if (intent.message) await say(intent.message)
      const chosen: ReviewIntent = intent
      let fieldId = chosen.field_id && FARM_QUESTIONS.some((q) => q.id === chosen.field_id) ? chosen.field_id : null
      if (!fieldId) {
        await say(promptsRef.current.edit_which)
        const heard = await hear()
        if (heard) {
          const out = await think(
            llm<ReviewIntent>({ mode: "review_intent", language: langRef.current, transcript: heard, answers: answersRef.current })
          )
          fieldId = out?.field_id && FARM_QUESTIONS.some((q) => q.id === out.field_id) ? out.field_id : null
          if (fieldId && out?.new_value_transcript) chosen.new_value_transcript = out.new_value_transcript
        }
      }
      if (fieldId) {
        await askQuestion(fieldId, chosen.new_value_transcript || undefined)
      }
    }
    return "cancelled"
  }

  const saveField = async () => {
    setPhase("saving")
    await say(promptsRef.current.saving)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const r = await fetch("/api/my-farm/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          answers: answersRef.current,
          detected: detectedRef.current,
          language: langRef.current,
          clientId: getClientId(),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || `Save failed (${r.status})`)
      setSavedId(j.id)
      setPhase("done")
      await say(promptsRef.current.saved)
      void loadSaved()
    } catch (e: any) {
      setError(e?.message || "Save failed")
      setPhase("error")
      await say(promptsRef.current.save_failed)
    }
  }

  // ---------- Runners ----------
  const stopAll = () => {
    runSignal.current.aborted = true
    try {
      runSignal.current.recognition?.abort?.()
    } catch {
      /* ignore */
    }
    stopSpeaking()
  }

  const handleRunError = (e: any) => {
    if (e instanceof VoiceAbort) {
      setPhase("idle")
      return
    }
    console.error(e)
    setError(e?.message || "Something went wrong")
    setPhase("error")
  }

  const startFresh = async () => {
    stopAll()
    runSignal.current = { aborted: false }
    setError(null)
    setSavedId(null)
    setLog([])
    answersRef.current = {}
    setAnswers({})
    setCurrentId(null)
    try {
      const locationPromise = locate()
      const code = await askLanguage()
      if (!code) {
        setPhase("language")
        return // buttons stay visible for manual pick
      }
      await runFrom(code, locationPromise)
    } catch (e) {
      handleRunError(e)
    }
  }

  const runFrom = async (code: string, locationPromise?: Promise<DetectedLocation | null>) => {
    await prepareLanguage(code)
    await say(promptsRef.current.welcome)
    if (locationPromise) await locationPromise
    else if (!detectedRef.current) await locate()
    for (const q of FARM_QUESTIONS) {
      checkAbort()
      await askQuestion(q.id)
    }
    const result = await review()
    if (result === "cancelled") setPhase("review")
  }

  const pickLanguageManually = async (code: string) => {
    stopAll()
    runSignal.current = { aborted: false }
    setError(null)
    try {
      const locationPromise = detectedRef.current ? undefined : locate()
      await runFrom(code, locationPromise)
    } catch (e) {
      handleRunError(e)
    }
  }

  const reaskField = async (id: string) => {
    if (!language) return
    stopAll()
    runSignal.current = { aborted: false }
    setError(null)
    try {
      await askQuestion(id)
      const result = await review()
      if (result === "cancelled") setPhase("review")
    } catch (e) {
      handleRunError(e)
    }
  }

  const reviewAgain = async () => {
    if (!language) return
    stopAll()
    runSignal.current = { aborted: false }
    setError(null)
    try {
      const result = await review()
      if (result === "cancelled") setPhase("review")
    } catch (e) {
      handleRunError(e)
    }
  }

  const saveNow = async () => {
    stopAll()
    runSignal.current = { aborted: false }
    try {
      await saveField()
    } catch (e) {
      handleRunError(e)
    }
  }

  const typeAnswer = (id: string, text: string) => {
    const existing = answersRef.current[id]
    setAnswer(id, {
      value: text || null,
      display: text,
      unknown: !text,
      details: existing?.details || {},
      transcript: existing?.transcript || "",
    })
  }

  const busy = !["idle", "done", "error", "review", "language"].includes(phase) || (phase === "review" && interim !== "")
  const lang = useMemo(() => languageByCode(language), [language])
  const answeredCount = FARM_QUESTIONS.filter((q) => answers[q.id]).length

  const statusText: Record<Phase, string> = {
    idle: "Press Start and answer by voice.",
    language: "Say your language, or tap one below.",
    preparing: `Preparing questions in ${lang.name}…`,
    asking: "Speaking…",
    listening: prompts.listening || "Listening…",
    thinking: "Understanding your answer…",
    review: "Review the details, then confirm by voice or tap Save.",
    saving: "Saving…",
    done: "Saved.",
    error: "Something went wrong.",
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Conversation */}
      <section className="lg:col-span-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Voice registration</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-800">Tell me about your field</h2>
            <p className="mt-1 text-sm text-stone-500">
              {language ? `${lang.native} · ` : ""}
              {statusText[phase]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {busy ? (
              <button
                type="button"
                onClick={() => {
                  stopAll()
                  setPhase(language ? "review" : "idle")
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Square className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startFresh()}
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Mic className="h-4 w-4" /> {phase === "idle" ? "Start" : "Start again"}
              </button>
            )}
          </div>
        </div>

        {(!support.stt || !support.tts) && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {!support.stt
              ? "Speech recognition is not available in this browser. Use Chrome or Edge on phone or laptop, or type into the form."
              : "Speech output is not available; questions will be shown as text."}
          </p>
        )}

        {/* Language picker (always available while choosing) */}
        {(phase === "language" || phase === "idle") && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <Languages className="h-3.5 w-3.5" /> Or tap your language
            </p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => void pickLanguageManually(l.code)}
                  className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:border-green-500 hover:bg-green-50"
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mic visual */}
        <div className="mt-5 flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
              phase === "listening"
                ? "bg-red-500 text-white shadow-[0_0_0_10px_rgba(239,68,68,0.15)] animate-pulse"
                : phase === "asking"
                  ? "bg-emerald-500 text-white"
                  : phase === "thinking" || phase === "preparing" || phase === "saving"
                    ? "bg-stone-200 text-stone-600"
                    : "bg-stone-100 text-stone-500"
            }`}
          >
            {phase === "listening" ? (
              <Mic className="h-7 w-7" />
            ) : phase === "asking" ? (
              <Volume2 className="h-7 w-7" />
            ) : phase === "thinking" || phase === "preparing" || phase === "saving" ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : phase === "done" ? (
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {interim ? (
              <p className="truncate text-base text-stone-800">{interim}</p>
            ) : currentId ? (
              <p className="text-sm text-stone-600">
                Question {FARM_QUESTIONS.findIndex((q) => q.id === currentId) + 1} of {FARM_QUESTIONS.length} ·{" "}
                {FARM_QUESTIONS.find((q) => q.id === currentId)?.label}
              </p>
            ) : (
              <p className="text-sm text-stone-500">
                {answeredCount}/{FARM_QUESTIONS.length} answered
              </p>
            )}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(answeredCount / FARM_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
            {/OPENROUTER_API_KEY/.test(error) && (
              <p className="mt-1 text-xs text-red-600/80">Add OPENROUTER_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.</p>
            )}
          </div>
        )}

        {/* Transcript log */}
        <div className="mt-5 max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-stone-50 p-3">
          {log.length === 0 && (
            <p className="text-sm text-stone-400">
              The assistant will first ask your language, then the {FARM_QUESTIONS.length} field questions, read everything back, and save
              only after you confirm.
            </p>
          )}
          {log.map((line, i) => (
            <div key={i} className={`flex ${line.who === "farmer" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  line.who === "farmer"
                    ? "bg-green-600 text-white"
                    : line.who === "system"
                      ? "bg-stone-200 text-stone-600 text-xs"
                      : "bg-white text-stone-800 shadow-sm"
                }`}
              >
                {line.text}
              </p>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </section>

      {/* Form + location */}
      <section className="lg:col-span-2 space-y-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-800">Field form</h3>
            <span className="text-xs text-stone-400">filled by your voice · editable</span>
          </div>
          <div className="mt-3 space-y-3">
            {FARM_QUESTIONS.map((q, idx) => {
              const a = answers[q.id]
              const active = currentId === q.id
              return (
                <div key={q.id} className={`rounded-xl border px-3 py-2 ${active ? "border-green-500 bg-green-50/40" : "border-stone-100"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-stone-500">
                      {idx + 1}. {q.label}
                    </label>
                    {language && !busy && (
                      <button
                        type="button"
                        title="Ask again by voice"
                        onClick={() => void reaskField(q.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-green-700"
                      >
                        <Mic className="h-3 w-3" /> re-ask
                      </button>
                    )}
                  </div>
                  <input
                    value={a ? (a.unknown ? "" : a.display || a.value || "") : ""}
                    placeholder={a?.unknown ? "Unknown" : "—"}
                    onChange={(e) => typeAnswer(q.id, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-800 focus:border-green-500 focus:outline-none"
                  />
                  {q.id === "location" && detected?.lat && (
                    <p className="mt-1 text-[11px] text-stone-400">
                      GPS: {detected.lat.toFixed(5)}, {detected.lon.toFixed(5)}
                      {detected.accuracy ? ` (±${Math.round(detected.accuracy)} m)` : ""}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!language || busy}
              onClick={() => void reviewAgain()}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> Read back
            </button>
            <button
              type="button"
              disabled={busy || !answers.field_name?.value || !answers.crop?.value}
              onClick={() => void saveNow()}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            {savedId && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-base font-semibold text-stone-800">
              <MapPin className="h-4 w-4 text-red-500" /> Where you are
            </h3>
            <button
              type="button"
              onClick={() => void locate()}
              disabled={locating}
              className="text-xs text-stone-500 hover:text-green-700 disabled:opacity-50"
            >
              {locating ? "Locating…" : "Detect again"}
            </button>
          </div>
          {detected?.lat ? (
            <>
              <p className="mt-1 text-sm text-stone-700">
                {[detected.village, detected.district, detected.state].filter(Boolean).join(", ") || detected.display || "Coordinates only"}
              </p>
              <iframe
                title="Field location"
                className="mt-3 h-48 w-full rounded-xl border border-stone-100"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${detected.lon - 0.01},${detected.lat - 0.008},${detected.lon + 0.01},${detected.lat + 0.008}&layer=mapnik&marker=${detected.lat},${detected.lon}`}
              />
            </>
          ) : (
            <p className="mt-1 text-sm text-stone-500">
              {locating ? "Asking the browser for GPS…" : "Location is detected when you press Start (allow the location prompt)."}
            </p>
          )}
        </div>

        {saved.length > 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-stone-800">Saved fields</h3>
            <ul className="mt-2 divide-y divide-stone-100">
              {saved.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {f.fieldName || "Field"} · {f.crop || "—"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {[f.location?.village, f.location?.district, f.location?.state].filter(Boolean).join(", ")}
                      {f.area?.value ? ` · ${f.area.value} ${f.area.unit || ""}` : ""}
                    </p>
                  </div>
                  {f.createdAt && <span className="text-[11px] text-stone-400">{new Date(f.createdAt).toLocaleDateString("en-IN")}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

export default VoiceFarmWizard
