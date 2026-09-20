/** Browser speech helpers (Web Speech API) used by the My Farm voice wizard. */

export class VoiceAbort extends Error {
  constructor() {
    super('aborted')
    this.name = 'VoiceAbort'
  }
}

export function speechSupported() {
  if (typeof window === 'undefined') return { tts: false, stt: false }
  const w = window as any
  return {
    tts: 'speechSynthesis' in window,
    stt: Boolean(w.SpeechRecognition || w.webkitSpeechRecognition),
  }
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis
  let voices = synth.getVoices()
  if (voices.length) return voices
  await new Promise<void>((resolve) => {
    const done = () => resolve()
    synth.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1200)
  })
  voices = synth.getVoices()
  return voices
}

export async function pickVoice(lang: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices()
  const norm = (s: string) => s.replace('_', '-').toLowerCase()
  const want = norm(lang)
  const prefix = want.split('-')[0]
  return (
    voices.find((v) => norm(v.lang) === want && /google|natural|online/i.test(v.name)) ||
    voices.find((v) => norm(v.lang) === want) ||
    voices.find((v) => norm(v.lang).startsWith(prefix + '-')) ||
    voices.find((v) => norm(v.lang) === prefix) ||
    null
  )
}

export async function hasVoiceFor(lang: string) {
  return Boolean(await pickVoice(lang))
}

let currentUtterance: SpeechSynthesisUtterance | null = null
let currentAudio: HTMLAudioElement | null = null

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.src = ''
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
}

export type MicStatus = 'granted' | 'denied' | 'unavailable' | 'error'

export interface MicCheck {
  status: MicStatus
  /** DOMException name, e.g. NotAllowedError, NotReadableError. */
  errorName?: string
  errorMessage?: string
  /** Number of audio input devices the browser can see (labels hidden until permission). */
  inputs?: number
}

/**
 * Ask for the microphone inside the user's click so the browser prompt appears right away.
 * Speech recognition then starts without a second prompt.
 */
export async function ensureMicPermission(): Promise<MicCheck> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { status: 'unavailable', errorName: 'NoMediaDevices' }
  }
  let inputs: number | undefined
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    inputs = devices.filter((d) => d.kind === 'audioinput').length
  } catch {
    /* ignore */
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return { status: 'granted', inputs }
  } catch (e: any) {
    const errorName = e?.name || 'Error'
    const errorMessage = e?.message || ''
    if (errorName === 'NotAllowedError' || errorName === 'SecurityError' || errorName === 'PermissionDeniedError') {
      return { status: 'denied', errorName, errorMessage, inputs }
    }
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorName === 'OverconstrainedError' || inputs === 0) {
      return { status: 'unavailable', errorName, errorMessage, inputs }
    }
    // NotReadableError / AbortError / TrackStartError: device exists but could not start
    // (Windows privacy toggle, another app holding the mic, driver issue).
    return { status: 'error', errorName, errorMessage, inputs }
  }
}

/** Play server-rendered speech (for languages the browser has no voice for). */
async function speakRemote(text: string, lang: string, signal?: { aborted: boolean }): Promise<boolean> {
  try {
    const url = `/api/my-farm/tts?lang=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`
    const r = await fetch(url)
    if (!r.ok) return false
    const blob = await r.blob()
    if (!blob.size) return false
    if (signal?.aborted) throw new VoiceAbort()
    const objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    currentAudio = audio
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        URL.revokeObjectURL(objectUrl)
        if (currentAudio === audio) currentAudio = null
        resolve()
      }
      audio.onended = done
      audio.onerror = done
      audio.onpause = () => {
        if (audio.ended || audio.currentTime === 0) return
        done()
      }
      audio.play().catch((e) => {
        settled = true
        URL.revokeObjectURL(objectUrl)
        reject(e)
      })
    })
    return true
  } catch (e) {
    if (e instanceof VoiceAbort) throw e
    return false
  }
}

function speakLocal(text: string, lang: string, voice: SpeechSynthesisVoice | null): Promise<void> {
  const synth = window.speechSynthesis
  return new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice?.lang || lang
    if (voice) u.voice = voice
    u.rate = 0.92
    u.pitch = 1
    u.volume = 1
    let settled = false
    let started = false
    const finish = () => {
      if (settled) return
      settled = true
      currentUtterance = null
      resolve()
    }
    u.onstart = () => {
      started = true
    }
    u.onend = finish
    u.onerror = finish
    currentUtterance = u
    // Chrome occasionally never fires onend for long utterances; guard with a timer.
    const words = text.split(/\s+/).length
    setTimeout(finish, Math.min(60_000, 2500 + words * 600))
    // Delay so cancel() has flushed, then detect a silently dropped utterance.
    setTimeout(() => {
      synth.speak(u)
      setTimeout(() => {
        if (!started && !synth.speaking && !synth.pending) finish()
      }, 1500)
    }, 80)
  })
}

/**
 * Speak text and resolve when finished.
 * Uses the browser voice when one exists for the language; otherwise streams audio
 * from /api/my-farm/tts so Telugu/Tamil/... still play on desktop browsers.
 */
export async function speak(text: string, lang: string, signal?: { aborted: boolean }): Promise<void> {
  if (!text || typeof window === 'undefined') return
  if (signal?.aborted) throw new VoiceAbort()
  const hasSynth = 'speechSynthesis' in window
  if (hasSynth) window.speechSynthesis.cancel()

  const voice = hasSynth ? await pickVoice(lang) : null
  const prefix = lang.split('-')[0].toLowerCase()
  const voiceMatches = Boolean(voice && voice.lang.replace('_', '-').toLowerCase().startsWith(prefix))

  if (!voiceMatches) {
    const ok = await speakRemote(text, lang, signal)
    if (ok) {
      if (signal?.aborted) throw new VoiceAbort()
      return
    }
  }
  if (hasSynth) await speakLocal(text, lang, voice)
  if (signal?.aborted) throw new VoiceAbort()
}

export interface ListenOptions {
  lang: string
  /** Give up if nothing final arrives within this many ms. */
  timeoutMs?: number
  onInterim?: (text: string) => void
  onStart?: () => void
  signal?: { aborted: boolean; recognition?: any }
}

/** Listen for a single utterance. Rejects with Error('no-speech') when nothing was heard. */
export function listenOnce(opts: ListenOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('unsupported'))
    const w = window as any
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) return reject(new Error('unsupported'))
    if (opts.signal?.aborted) return reject(new VoiceAbort())

    const rec = new Ctor()
    rec.lang = opts.lang
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    if (opts.signal) opts.signal.recognition = rec

    let finalText = ''
    let interimText = ''
    let settled = false
    const timeout = setTimeout(() => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }, opts.timeoutMs ?? 12_000)

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      fn()
    }

    rec.onstart = () => opts.onStart?.()
    rec.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      interimText = interim
      opts.onInterim?.(finalText || interim)
    }
    rec.onerror = (event: any) => {
      if (event.error === 'aborted' && opts.signal?.aborted) return settle(() => reject(new VoiceAbort()))
      if (event.error === 'no-speech' || event.error === 'aborted') return settle(() => reject(new Error('no-speech')))
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        return settle(() => reject(new Error('mic-denied')))
      }
      settle(() => reject(new Error(event.error || 'speech-error')))
    }
    rec.onend = () => {
      const text = (finalText || interimText).trim()
      if (opts.signal?.aborted) return settle(() => reject(new VoiceAbort()))
      settle(() => (text ? resolve(text) : reject(new Error('no-speech'))))
    }
    try {
      rec.start()
    } catch (e: any) {
      settle(() => reject(new Error(e?.message || 'speech-start-failed')))
    }
  })
}

/** Short attention beep before the mic opens. */
export function beep(durationMs = 140, freq = 880) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close().catch(() => undefined)
    }, durationMs)
  } catch {
    /* ignore */
  }
}
