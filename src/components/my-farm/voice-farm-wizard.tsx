"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mic } from "lucide-react"
import { ThinkingOrb, type OrbState } from "@/components/ui/thinking-orbs"
import {
  FARM_QUESTIONS,
  SUPPORTED_LANGUAGES,
  languageByCode,
  type Answers,
  type Answer,
  type DetectedLocation,
} from "@/lib/my-farm-schema"
import { beep, ensureMicPermission, listenOnce, speak, speechSupported, stopSpeaking, VoiceAbort, type MicStatus } from "@/lib/voice"
import { saveFarmLocal, snapshotFromAnswers } from "@/lib/farm-local-client"

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
  has_new_value?: boolean
  new_value_transcript: string | null
  message: string
}

/** Only trust a spoken replacement value when the model flagged it and it is a proper sub-part of what was heard. */
function usableNewValue(intent: ReviewIntent, heard: string): string | null {
  const v = (intent.new_value_transcript || "").trim()
  if (!intent.has_new_value || !v) return null
  const norm = (s: string) => s.replace(/[\s.,!?।]+/g, " ").trim().toLowerCase()
  if (norm(v) === norm(heard)) return null
  return v
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

const HINDI_PROMPTS: Prompts = {
  welcome: "अच्छा, हम हिंदी में बात करेंगे। खेत के बारे में कुछ सवाल पूछूँगा। बीप के बाद जवाब बोलिए।",
  listening: "सुन रहा हूँ",
  not_heard: "सुनाई नहीं दिया। फिर से बोलिए।",
  unknown_ok: "कोई बात नहीं, इसे खाली छोड़ देते हैं।",
  review_intro: "आपने यह बताया।",
  confirm_ask: "सब सही है? हाँ बोलिए, या जो बदलना है वह बताइए।",
  edit_which: "कौन सी बात बदलनी है?",
  saving: "खेत की जानकारी सेव कर रहा हूँ।",
  saved: "सेव हो गया। धन्यवाद।",
  save_failed: "सेव नहीं हो पाया। फिर कोशिश कीजिए।",
  location_found: "जीपीएस से जगह मिल गई।",
  location_missing: "जगह अपने आप नहीं मिली।",
}

const HINDI_QUESTIONS: Record<string, string> = {
  field_name: "इस खेत का नाम क्या रखना है?",
  crop: "आप कौन सी फसल उगा रहे हैं?",
  variety: "किस्म का नाम मालूम है? नहीं तो कह दीजिए।",
  location: "यह खेत कहाँ है — गाँव, ज़िला, राज्य?",
  area: "खेत कितना बड़ा है? एकड़ या हेक्टेयर बोलिए।",
  sowing: "फसल कब बोई या रोपी थी?",
  stage: "फसल किस अवस्था में है — पौधा, फूल, या फल?",
  soil: "मिट्टी कैसी है — काली, लाल, रेतीली? नहीं पता तो बोल दीजिए।",
  irrigation: "पानी कैसे देते हैं — ड्रिप, फव्वारा, नाली, या बारिश?",
}

const CROP_ALIASES: [RegExp, string][] = [
  [/tomato|टामेटो|टमाटर|tamatar/i, "Tomato"],
  [/rice|paddy|धान|चावल/i, "Rice"],
  [/chilli|chili|mirchi|मिर्ची|मिर्च/i, "Chilli"],
  [/cotton|कपास/i, "Cotton"],
  [/wheat|गेहूं|गेहूँ/i, "Wheat"],
  [/maize|corn|मक्का/i, "Maize"],
  [/onion|प्याज/i, "Onion"],
  [/brinjal|baingan|बैंगन/i, "Brinjal"],
  [/groundnut|मूंगफली|मूँगफली/i, "Groundnut"],
]

function normSpeech(s: string) {
  return s.replace(/[\s?.!,।]+/g, " ").trim().toLowerCase()
}

function isUnknownPhrase(text: string) {
  return /nahi\s*pata|nahin\s*pata|nahi\s*malum|don't know|do not know|unknown|no idea|पता\s*नहीं|नहीं\s*पता|नही\s*पता|मालूम\s*नहीं|नाही\s*माहीत/i.test(text)
}

function isQuestionEcho(heard: string, asked: string) {
  const h = normSpeech(heard)
  const a = normSpeech(asked)
  if (!h || !a) return false
  if (isUnknownPhrase(heard) || isUnknownPhrase(h)) return false
  if (h === a) return true
  // Short replies are answers. "नहीं पता" appears inside the variety question — that is not an echo.
  if (h.length < 16) return false
  const overlap = a.includes(h) || h.includes(a)
  const shorter = Math.min(h.length, a.length)
  const longer = Math.max(h.length, a.length)
  return overlap && shorter >= longer * 0.55
}

function quickAnswer(id: string, transcript: string): Answer | null {
  const t = transcript.trim()
  if (t.length < 1) return null
  const q = FARM_QUESTIONS.find((x) => x.id === id)
  if (!q) return null
  if (isUnknownPhrase(t) && q.allowUnknown) {
    return { value: null, display: "—", unknown: true, details: {}, transcript: t }
  }
  if (q.kind === "text" || q.kind === "crop" || q.kind === "variety") {
    let value = t
    const details: Record<string, unknown> = {}
    if (q.kind === "crop") {
      const hit = CROP_ALIASES.find(([re]) => re.test(t))
      if (hit) value = hit[1]
      details.crop_local = t
    }
    return { value, display: t, unknown: false, details, transcript: t }
  }
  return null
}

const MIC_DENIED_MESSAGE =
  "Microphone is blocked for this site. Click the lock/camera icon in the address bar, set Microphone to Allow, then press Retry microphone."

const WINDOWS_MIC_HINT =
  "If Chrome already says Allow: open Windows Settings → Privacy & security → Microphone, turn on “Microphone access” and “Let desktop apps access your microphone”, close other apps using the mic (Zoom, Teams, Discord), then press Retry microphone."

function micProblemMessage(check: { status: string; errorName?: string; errorMessage?: string; inputs?: number }) {
  const detail = check.errorName ? ` (${check.errorName}${check.errorMessage ? `: ${check.errorMessage}` : ""})` : ""
  if (check.status === "unavailable") {
    return `No microphone was found on this device${detail}. Plug in or enable a mic, or type the answers in the form.`
  }
  if (check.status === "denied") {
    return `${MIC_DENIED_MESSAGE}${detail} ${WINDOWS_MIC_HINT}`
  }
  return `The microphone could not start${detail}. ${WINDOWS_MIC_HINT}`
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
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 7000)
  try {
    const r = await fetch("/api/my-farm/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || `Assistant error (${r.status})`)
    return j as T
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("assistant-timeout")
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export function VoiceFarmWizard({ mode = "settings" }: { mode?: "setup" | "settings" }) {
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
  const [micStatus, setMicStatus] = useState<MicStatus | "unknown">("unknown")

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

  const persistDraft = useCallback((next: Answers) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) return
    void fetch("/api/farm/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: next, language: langRef.current, detected: detectedRef.current }),
    }).catch(() => undefined)
  }, [])

  const setAnswer = useCallback((id: string, a: Answer) => {
    answersRef.current = { ...answersRef.current, [id]: a }
    setAnswers(answersRef.current)
    persistDraft(answersRef.current)
  }, [persistDraft])

  const checkAbort = () => {
    if (runSignal.current.aborted) throw new VoiceAbort()
  }

  const say = async (text: string) => {
    checkAbort()
    pushLog("assistant", text)
    setPhase("asking")
    await speak(text, langRef.current, runSignal.current)
  }

  const hear = async (timeoutMs = 28_000): Promise<string | null> => {
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
        setMicStatus("denied")
        throw new Error(`${MIC_DENIED_MESSAGE} ${WINDOWS_MIC_HINT}`)
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
      if (token) {
        const p = await fetch("/api/farm/profile", { headers: { Authorization: `Bearer ${token}` } })
        if (p.ok) {
          const j = await p.json()
          if (j.draft?.answers && Object.keys(j.draft.answers).length) {
            answersRef.current = j.draft.answers
            setAnswers(j.draft.answers)
            if (j.draft.language) {
              langRef.current = j.draft.language
              setLanguage(j.draft.language)
            }
            if (j.draft.detected) {
              detectedRef.current = j.draft.detected
              setDetected(j.draft.detected)
            }
            pushLog("system", "Resuming the answers you already gave.")
          }
          if (j.setupComplete && j.profile) {
            setSaved([
              {
                id: j.profile.field_id || j.profile.id,
                fieldName: j.profile.fieldName,
                crop: j.profile.crop,
                location: j.profile.location,
                area: j.profile.area,
              },
            ])
            if (mode === "setup" && !j.draft?.answers) {
              window.location.href = "/dashboard"
              return
            }
          }
        }
      }
      const r = await fetch(`/api/my-farm/fields?clientId=${encodeURIComponent(getClientId())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (r.ok) {
        const j = await r.json()
        setSaved((prev) => (prev.length ? prev : j.fields || []))
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
    for (let attempt = 0; attempt < 4; attempt++) {
      const heard = await hear(28_000)
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
    if (code === "hi-IN") {
      questionsRef.current = HINDI_QUESTIONS
      promptsRef.current = HINDI_PROMPTS
      setQuestions(HINDI_QUESTIONS)
      setPrompts(HINDI_PROMPTS)
      return
    }
    try {
      const out = await llm<{ questions: Record<string, string>; prompts: Prompts }>({
        mode: "translate_prompts",
        language: code,
      })
      questionsRef.current = out.questions || {}
      promptsRef.current = { ...ENGLISH_PROMPTS, ...(out.prompts || {}) }
    } catch {
      questionsRef.current = {}
      promptsRef.current = ENGLISH_PROMPTS
    }
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

  const askQuestion = async (id: string, overrideTranscript?: string, promptText?: string): Promise<void> => {
    const q = FARM_QUESTIONS.find((x) => x.id === id)!
    setCurrentId(id)
    const history: { role: "assistant" | "farmer"; text: string }[] = []
    let transcript: string | null = overrideTranscript ?? null
    if (!transcript) {
      const text = promptText || (await questionText(id))
      if (!promptText && q.kind === "location" && detectedRef.current?.lat) pushLog("system", promptsRef.current.location_found)
      await say(text)
      history.push({ role: "assistant", text })
    } else if (promptText) {
      history.push({ role: "assistant", text: promptText })
    }

    const askedText = history.find((h) => h.role === "assistant")?.text || ""
    // Optional fields get one clarification, required fields two; then we accept what we have.
    const maxClarify = q.allowUnknown ? 1 : 2
    let clarifications = 0
    let silence = 0
    let lastHeard: string | null = null

    while (true) {
      if (!transcript) {
        transcript = await hear()
        if (!transcript) {
          silence++
          if (silence >= 8) break
          await say(promptsRef.current.not_heard)
          continue
        }
      }
      if (isQuestionEcho(transcript, askedText)) {
        transcript = null
        continue
      }
      lastHeard = transcript
      history.push({ role: "farmer", text: transcript })
      const instant = quickAnswer(id, transcript)
      if (instant) {
        setAnswer(id, instant)
        if (instant.unknown) await say(promptsRef.current.unknown_ok)
        return
      }
      let out: { ok: boolean; unknown: boolean; value: string | null; display: string; clarify: string | null; details: Record<string, unknown> }
      try {
        out = await think(
          llm<{ ok: boolean; unknown: boolean; value: string | null; display: string; clarify: string | null; details: Record<string, unknown> }>({
            mode: "extract",
            language: langRef.current,
            questionId: id,
            transcript,
            history,
            answers: answersRef.current,
            detected: detectedRef.current,
          })
        )
      } catch {
        setAnswer(id, { value: transcript, display: transcript, unknown: false, details: {}, transcript })
        return
      }
      if (out.ok || out.unknown) {
        setAnswer(id, {
          value: out.unknown ? null : out.value ?? transcript,
          display: out.unknown ? "—" : out.display || out.value || transcript,
          unknown: Boolean(out.unknown),
          details: out.details || {},
          transcript,
        })
        if (out.unknown) await say(promptsRef.current.unknown_ok)
        return
      }
      if (clarifications >= maxClarify) break
      clarifications++
      const follow = out.clarify || promptsRef.current.not_heard
      await say(follow)
      history.push({ role: "assistant", text: follow })
      transcript = null
    }

    // Fallback: never throw away what the farmer said. Optional -> unknown; required -> keep raw words.
    if (q.allowUnknown || !lastHeard) {
      setAnswer(id, { value: null, display: "—", unknown: true, details: {}, transcript: lastHeard || "" })
      if (lastHeard || silence >= 3) await say(promptsRef.current.unknown_ok)
    } else {
      setAnswer(id, { value: lastHeard, display: lastHeard, unknown: false, details: {}, transcript: lastHeard })
    }
  }

  const review = async (changedField: string | null = null): Promise<"saved" | "cancelled"> => {
    let lastChanged: string | null = changedField
    for (let loops = 0; loops < 6; loops++) {
      setCurrentId(null)
      setPhase("review")
      const s = await think(
        llm<{ summary: string; question: string }>({
          mode: "summary",
          language: langRef.current,
          answers: answersRef.current,
          changedField: lastChanged,
        })
      )
      if (!lastChanged) await say(promptsRef.current.review_intro)
      await say(s.summary)
      await say(s.question || promptsRef.current.confirm_ask)
      lastChanged = null

      let intent: ReviewIntent | null = null
      let heardIntent = ""
      for (let tries = 0; tries < 3 && !intent; tries++) {
        const heard = await hear(28_000)
        if (!heard) {
          await say(promptsRef.current.not_heard)
          continue
        }
        const out = await think(
          llm<ReviewIntent>({ mode: "review_intent", language: langRef.current, transcript: heard, answers: answersRef.current })
        )
        if (out && out.action !== "unclear") {
          intent = out
          heardIntent = heard
        } else if (out?.message) await say(out.message)
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
      const chosen: ReviewIntent = intent
      let fieldId = chosen.field_id && FARM_QUESTIONS.some((q) => q.id === chosen.field_id) ? chosen.field_id : null
      let newValue = usableNewValue(chosen, heardIntent)
      let followUp = chosen.message || ""
      if (!fieldId) {
        await say(promptsRef.current.edit_which)
        const heard = await hear()
        if (heard) {
          const out = await think(
            llm<ReviewIntent>({ mode: "review_intent", language: langRef.current, transcript: heard, answers: answersRef.current })
          )
          fieldId = out?.field_id && FARM_QUESTIONS.some((q) => q.id === out.field_id) ? out.field_id : null
          if (fieldId) {
            newValue = usableNewValue(out, heard)
            followUp = out.message || ""
          }
        }
      }
      if (!fieldId) continue
      if (newValue) {
        // Farmer already said the replacement ("change crop to cotton"): acknowledge and apply.
        if (followUp) await say(followUp)
        await askQuestion(fieldId, newValue, followUp || undefined)
      } else {
        // Farmer only named the field: ask for the new value (model's question, else the original question) and listen.
        await askQuestion(fieldId, undefined, followUp || undefined)
      }
      lastChanged = fieldId
    }
    return "cancelled"
  }

  const saveField = async () => {
    setPhase("saving")
    await say(promptsRef.current.saving)
    const local = snapshotFromAnswers(answersRef.current, detectedRef.current, langRef.current)
    saveFarmLocal(local)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) throw new Error("Sign in first so this field is saved with your farmer profile.")
      const r = await fetch("/api/farm/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers: answersRef.current,
          detected: detectedRef.current,
          language: langRef.current,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.profile) saveFarmLocal(j.profile)
      else if (!r.ok && !(local.fieldName && local.crop)) {
        throw new Error("Could not save the farm. Add the field name and crop, then try again.")
      }
      setSavedId(j.profile?.field_id || j.profile?.id || local.field_id || "saved")
      setPhase("done")
      await say(promptsRef.current.saved)
      if (mode === "setup") {
        window.location.href = "/dashboard"
        return
      }
      void loadSaved()
    } catch (e: any) {
      if (local.fieldName && local.crop) {
        setSavedId(local.field_id)
        setPhase("done")
        await say(promptsRef.current.saved)
        if (mode === "setup") window.location.href = "/dashboard"
        return
      }
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

  /** Ask for the mic inside the click; returns false (and shows guidance) when blocked. */
  const requestMic = async (): Promise<boolean> => {
    if (!support.stt) {
      setError("This browser has no speech recognition. Use Chrome or Edge, or type the answers in the form.")
      setPhase("error")
      return false
    }
    const check = await ensureMicPermission()
    setMicStatus(check.status)
    if (check.status === "granted") return true
    setError(micProblemMessage(check))
    setPhase("error")
    return false
  }

  const retryMic = async () => {
    setError(null)
    const ok = await requestMic()
    if (!ok) return
    if (currentId && language) await reaskField(currentId)
    else if (language) await reviewAgain()
    else await startFresh()
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
    if (!(await requestMic())) return
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
    langRef.current = code
    setLanguage(code)
    setPhase("preparing")
    if (micStatus !== "granted" && !(await requestMic())) return
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
      const result = await review(id)
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

  const orbByPhase: Record<Phase, { state: OrbState; label: string }> = {
    idle: { state: "listening", label: "Tap to begin" },
    language: { state: "listening", label: "Listening…." },
    preparing: { state: "working", label: "Working…." },
    asking: { state: "composing", label: "Speaking…." },
    listening: { state: "listening", label: "Listening…." },
    thinking: { state: "solving", label: "…" },
    review: { state: "shaping", label: "Checking…." },
    saving: { state: "working", label: "Saving…." },
    done: { state: "solving", label: "Saved." },
    error: { state: "searching", label: "Try again" },
  }
  const orb = orbByPhase[phase]

  const spoken = log.filter((l) => l.who !== "system")
  const visible = [
    ...spoken.slice(-3),
    ...(interim ? [{ who: "farmer" as const, text: interim }] : []),
  ]

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-6">
      <button
        type="button"
        onClick={() => {
          if (busy) {
            stopAll()
            setPhase(language ? "review" : "idle")
            return
          }
          void startFresh()
        }}
        className="group flex flex-col items-center gap-5"
        aria-label={busy ? "Stop" : "Start farm setup"}
      >
        <span className="[&_canvas]:!size-[4.5rem] sm:[&_canvas]:!size-20">
          <ThinkingOrb state={orb.state} size={64} theme="light" />
        </span>
        <span
          className="inline-flex h-[52px] items-center rounded-full px-6 text-base tracking-wide sm:h-[58px] sm:text-lg"
          style={{
            color: "rgba(28,25,23,0.55)",
            background: "rgba(245,245,244,0.95)",
            boxShadow: "inset 0 0 0 1px rgba(28,25,23,0.08), 0 8px 28px rgba(28,25,23,0.06)",
          }}
        >
          {orb.label}
        </span>
      </button>

      {(phase === "idle" || phase === "language" || (phase === "error" && !language)) && (
        <div className="mt-8 flex max-w-md flex-wrap justify-center gap-2">
          {SUPPORTED_LANGUAGES.slice(0, 6).map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => void pickLanguageManually(l.code)}
              className="rounded-full px-3 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              {l.native}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 flex min-h-[7.5rem] w-full max-w-xl flex-col items-center justify-end">
        {visible.length === 0 && phase === "idle" && (
          <p className="text-center text-sm text-stone-400">Speak after the orb. Nothing else is shown.</p>
        )}
        {visible.map((line, i) => {
          const fromEnd = visible.length - 1 - i
          const opacity = fromEnd === 0 ? 1 : fromEnd === 1 ? 0.38 : 0.14
          const scale = fromEnd === 0 ? 1 : fromEnd === 1 ? 0.96 : 0.92
          return (
            <p
              key={`${i}-${line.text.slice(0, 24)}`}
              className="mb-3 max-w-full text-center leading-relaxed transition-all duration-700"
              style={{
                opacity,
                transform: `scale(${scale}) translateY(${fromEnd * -4}px)`,
                color: line.who === "farmer" ? "rgba(28,25,23,0.92)" : "rgba(87,83,78,0.72)",
                fontSize: fromEnd === 0 ? "1.125rem" : "0.95rem",
              }}
            >
              {line.text}
            </p>
          )
        })}
        <div ref={logEndRef} />
      </div>

      {error && (
        <div className="mt-6 max-w-md text-center text-sm text-red-600">
          <p>{error}</p>
          {(micStatus === "denied" || micStatus === "error" || micStatus === "unavailable") && (
            <button
              type="button"
              onClick={() => void retryMic()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-200"
            >
              <Mic className="h-3.5 w-3.5" /> Retry microphone
            </button>
          )}
        </div>
      )}

      {phase === "review" && !busy && (
        <button
          type="button"
          onClick={() => void saveNow()}
          className="mt-6 text-xs text-stone-400 hover:text-stone-700"
        >
          Save
        </button>
      )}
    </div>
  )
}

export default VoiceFarmWizard
