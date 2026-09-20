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

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

/** Speak text and resolve when finished (or immediately if TTS is unavailable). */
export async function speak(text: string, lang: string, signal?: { aborted: boolean }): Promise<void> {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (signal?.aborted) throw new VoiceAbort()
  const synth = window.speechSynthesis
  synth.cancel()
  const voice = await pickVoice(lang)
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice?.lang || lang
    if (voice) u.voice = voice
    u.rate = 0.92
    u.pitch = 1
    u.volume = 1
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      currentUtterance = null
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    currentUtterance = u
    // Chrome occasionally never fires onend for long utterances; guard with a timer.
    const words = text.split(/\s+/).length
    setTimeout(finish, Math.min(60_000, 2500 + words * 600))
    // Delay so cancel() above has flushed.
    setTimeout(() => synth.speak(u), 80)
  })
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
