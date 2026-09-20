const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite'

function stripFences(text: string): string {
  const t = text.trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1] : t
}

export async function chatJson<T = any>(system: string, user: string, temperature = 0.2, maxTokens = 700): Promise<T> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured on the server')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://krishi-mithr.vercel.app',
        'X-Title': 'Krishi Mithr',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
    const text = await r.text()
    if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${text.slice(0, 300)}`)
    const data = JSON.parse(text)
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    if (!content) throw new Error('Empty model response')
    return JSON.parse(stripFences(content)) as T
  } finally {
    clearTimeout(timer)
  }
}
