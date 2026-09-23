import type { NextApiRequest, NextApiResponse } from 'next'
import {
  FARM_QUESTIONS,
  SUPPORTED_LANGUAGES,
  languageByCode,
  type Answers,
  type DetectedLocation,
} from '../../../src/lib/my-farm-schema'
import { chatJson } from '../../../src/lib/gemini'

/**
 * My Farm voice assistant brain.
 * All calls go to OpenRouter -> google/gemini-2.5-flash-lite and return strict JSON.
 *
 * modes:
 *   detect_language   { transcript }
 *   translate_prompts { language }
 *   phrase_question   { language, questionId, answers, detected }
 *   extract           { language, questionId, transcript, answers, detected }
 *   summary           { language, answers }
 *   review_intent     { language, transcript, answers }
 */

const BASE_SYSTEM = `You are the voice assistant of Krishi Mithr, an Indian farm app.
You talk to farmers who may be low-literacy. Use short, warm, simple spoken sentences.
Always answer with a single JSON object and nothing else. Never add markdown.`

function languageInstruction(code: string) {
  const lang = languageByCode(code)
  return `The farmer's language is ${lang.name} (${lang.code}). Write every farmer-facing string in ${lang.name} using its native script${
    lang.code === 'en-IN' ? '' : ' (not romanized)'
  }. Farm words that are commonly spoken in English (drip, sprinkler, acre, hybrid) may be kept as-is inside the sentence.`
}

function answersContext(answers: Answers | undefined) {
  if (!answers) return '{}'
  const compact: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(answers)) {
    compact[k] = { value: v.value, unknown: v.unknown, details: v.details }
  }
  return JSON.stringify(compact)
}

function questionById(id: string) {
  const q = FARM_QUESTIONS.find((x) => x.id === id)
  if (!q) throw new Error(`Unknown questionId ${id}`)
  return q
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const body = req.body || {}
  const mode = String(body.mode || '')
  const today = new Date().toISOString().slice(0, 10)

  try {
    switch (mode) {
      case 'detect_language': {
        const transcript = String(body.transcript || '')
        const list = SUPPORTED_LANGUAGES.map((l) => `${l.code} = ${l.name} / ${l.native}`).join('\n')
        const out = await chatJson(
          BASE_SYSTEM,
          `A farmer was asked which language they prefer. They said: "${transcript}".
The utterance may be in any Indian language or English, and may name the language or simply be spoken in it.
Pick the best match from this list:
${list}
Return {"code": "<code from list or null>", "confidence": 0-1}`,
          0
        )
        return res.status(200).json(out)
      }

      case 'translate_prompts': {
        const language = String(body.language || 'en-IN')
        const qs = FARM_QUESTIONS.map((q) => `- ${q.id}: "${q.question}"${q.allowUnknown ? ' (farmer may say they do not know)' : ''}`).join('\n')
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}`,
          `Translate these farm-form questions and assistant prompts. Keep meaning exact, keep them short and natural for speech.

Questions:
${qs}

Prompts:
- welcome: "Great, we will continue in this language. I will ask a few questions about your field. Answer by speaking after the beep."
- listening: "Listening"
- not_heard: "Sorry, I did not catch that. Please say it again."
- unknown_ok: "No problem, we will leave that blank."
- review_intro: "Here are the details you gave me."
- confirm_ask: "Is everything correct? Say yes to save, or tell me what to change."
- edit_which: "Which detail should I change?"
- saving: "Saving your field details."
- saved: "Your field has been saved. Thank you."
- save_failed: "Sorry, saving failed. Please try again."
- redirecting: "Redirecting you to the farm dashboard."
- location_found: "I found your location from GPS."
- location_missing: "I could not detect your location automatically."
- yes_words: comma-separated list of 6 common ways to say yes/correct in this language
- no_words: comma-separated list of 6 common ways to say no/change in this language

Return {"questions": {"<id>": "<translated>"}, "prompts": {"<key>": "<translated>"}}`,
          0.2,
          2500
        )
        return res.status(200).json(out)
      }

      case 'phrase_question': {
        const language = String(body.language || 'en-IN')
        const q = questionById(String(body.questionId))
        const detected = body.detected as DetectedLocation | undefined
        const answers = body.answers as Answers | undefined
        const extra =
          q.kind === 'location' && detected?.lat
            ? `GPS reverse-geocode found: village/town "${detected.village || ''}", district "${detected.district || ''}", state "${detected.state || ''}". Ask the farmer to confirm this location or tell the correct village, district and state.`
            : q.kind === 'stage' && answers?.crop?.value
              ? `The crop is "${answers.crop.value}". Name the growth stages using words a ${answers.crop.value} farmer uses (e.g. for rice: nursery, tillering, panicle, grain filling; for tomato: seedling, flowering, fruit setting).`
              : ''
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}`,
          `Phrase this question for speech. Base question (English): "${q.question}". ${q.hint}
${extra}
Known answers so far: ${answersContext(answers)}
Return {"question": "<one or two short spoken sentences>"}`
        )
        return res.status(200).json(out)
      }

      case 'extract': {
        const language = String(body.language || 'en-IN')
        const q = questionById(String(body.questionId))
        const transcript = String(body.transcript || '')
        const detected = body.detected as DetectedLocation | undefined
        const answers = body.answers as Answers | undefined
        const history = (Array.isArray(body.history) ? body.history : []) as { role: 'assistant' | 'farmer'; text: string }[]
        const historyText = history.length
          ? history.map((h) => `${h.role === 'assistant' ? 'Assistant' : 'Farmer'}: ${h.text}`).join('\n')
          : '(none)'
        const kindRules: Record<string, string> = {
          text: 'ANY non-empty reply is the name — names can be any words, including people or brand names ("Krishi Mitra", "Trisha"). Strip lead-ins like "call it" / "name is". Never ask to clarify a name; set ok=true.',
          crop: 'Accept any plausible crop even if the transcript is a phonetic spelling (e.g. "పొటాటో" = Potato, "మిరప" = Chilli). Clarify only if no crop can be inferred.',
          variety: 'If the farmer says they know but gives no name, ask once for the name. If they then still give no variety name, or say anything like "don\'t know", "you tell me", "skip", "leave it", set unknown=true and ok=true.',
          location: 'A "yes/correct/that is right" confirms the GPS suggestion. Otherwise take the places named.',
          area: 'Infer number words in the farmer\'s language ("రెండున్నర" = 2.5). If a number is given without a unit, assume acres and say so in display.',
          sowing: 'Relative expressions are fine ("two weeks ago", "last month", "before Dasara"). If only a month is given, use the 15th of that month and approximate=true. Ask to clarify only if no time reference at all.',
          stage: 'Map any description to one stage. "just planted / small plants" = seedling, "growing / leaves" = vegetative, "flowers" = flowering, "fruits / grains forming" = fruiting, "ready to cut" = maturity.',
          soil: 'Colour words count ("black soil", "red"). "don\'t know" → unknown=true, ok=true.',
          irrigation: 'Map to drip / sprinkler / surface (flood, canal, borewell, furrow) / rainfed. "motor" or "borewell" alone = surface.',
        }
        const kindSchema: Record<string, string> = {
          text: '"details": {}',
          crop: '"details": {"crop_en": "<English crop name>", "crop_local": "<name as farmer said>"}',
          variety: '"details": {}',
          location: '"details": {"village": "", "district": "", "state": "", "confirmed_gps": true|false}',
          area: '"details": {"number": <float>, "unit": "<acre|hectare|gunta|cent|bigha|kanal|katha|other>", "unit_local": "<as said>"}',
          sowing: '"details": {"date_iso": "YYYY-MM-DD or null", "approximate": true|false, "method": "<sowing|transplanting|direct seeding|unknown>"}',
          stage: '"details": {"stage": "<seedling|vegetative|flowering|fruiting|maturity>"}',
          soil: '"details": {"soil": "<black|red|sandy|loamy|clay|alluvial|laterite|other|unknown>"}',
          irrigation: '"details": {"method": "<drip|sprinkler|surface|rainfed|other>"}',
        }
        const gps =
          q.kind === 'location' && detected?.lat
            ? `GPS suggestion: village "${detected.village || ''}", district "${detected.district || ''}", state "${detected.state || ''}". If the farmer says yes/correct/that's right, use the GPS suggestion and set confirmed_gps=true. If they give a different place, use what they said.`
            : ''
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}\nToday is ${today}.
You are filling ONE form field from a spoken conversation. The farmer's latest reply is always an attempt to answer
the assistant's most recent line in the conversation below — interpret it in that context, not in isolation.
Speech recognition is noisy: choose the most plausible reading rather than rejecting. Clarify only when truly ambiguous,
and never ask the same clarification twice.`,
          `Field: ${q.id} (${q.label}). Guidance: ${q.hint}
Rules for this field: ${kindRules[q.kind] || ''}${q.allowUnknown ? ' The farmer may say they do not know; that is a valid answer (unknown=true, ok=true).' : ''}
${answers?.[q.id]?.value ? `This field currently holds "${answers[q.id].value}" and the farmer is CHANGING it — the new reply replaces the old value; never return the old value.` : ''}
${gps}
Known answers to other fields (context only): ${answersContext(
            answers ? Object.fromEntries(Object.entries(answers).filter(([k]) => k !== q.id)) : undefined
          )}

Conversation for THIS field so far (oldest first):
${historyText}

Farmer's latest reply (speech transcript): "${transcript}"

Decide:
- ok: true if a usable answer was captured (or farmer said they don't know).
- unknown: true only if the farmer said they do not know / skip / you decide.
- value: normalized value to store (English where the guidance asks, otherwise the farmer's words), or null.
- display: the value written in the farmer's language for reading back.
- clarify: only if ok is false — one short, specific follow-up in the farmer's language that acknowledges what they just said; else null.
Return {"ok": true|false, "unknown": true|false, "value": "<string or null>", "display": "<string>", "clarify": "<string or null>", ${kindSchema[q.kind]}}`,
          0.1
        )
        return res.status(200).json(out)
      }

      case 'summary': {
        const language = String(body.language || 'en-IN')
        const answers = body.answers as Answers
        const changed = typeof body.changedField === 'string' ? body.changedField : null
        const lines = FARM_QUESTIONS.map((q) => {
          const a = answers?.[q.id]
          return `- ${q.id} (${q.label}): ${a ? (a.unknown ? 'not known' : a.display || a.value || '') : 'not answered'}`
        }).join('\n')
        if (changed && answers?.[changed]) {
          const q = questionById(changed)
          const a = answers[changed]
          const out = await chatJson(
            `${BASE_SYSTEM}\n${languageInstruction(language)}`,
            `The farmer just corrected one detail. Confirm ONLY that detail in one short sentence, then ask whether anything else should change or whether to save.
Changed field: ${q.label} -> ${a.unknown ? 'not known' : a.display || a.value}
Return {"summary": "<one sentence confirming the change>", "question": "<anything else to change, or shall I save?>"}`,
            0.2,
            400
          )
          return res.status(200).json(out)
        }
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}`,
          `Read these field details back to the farmer so they can check them. One short sentence per item, in order, then ask if everything is correct or what to change.
${lines}
Return {"summary": "<spoken read-back>", "question": "<is everything correct or what should I change>"}`,
          0.2,
          1200
        )
        return res.status(200).json(out)
      }

      case 'review_intent': {
        const language = String(body.language || 'en-IN')
        const transcript = String(body.transcript || '')
        const answers = body.answers as Answers | undefined
        const ids = FARM_QUESTIONS.map((q) => `${q.id} = ${q.label}`).join('; ')
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}`,
          `The farmer just heard the read-back of their field details and was asked whether everything is correct or what to change.
They said: "${transcript}"
Fields: ${ids}
Current answers: ${answersContext(answers)}

Classify:
- "confirm" if they agree / say save / everything is right.
- "edit" if they want to change something. Set field_id to the field they mean.
  * has_new_value=true ONLY if the sentence itself contains the replacement value (e.g. "change the crop to cotton", "the area is 5 acres, not 8"). Then new_value_transcript = just the value part ("cotton", "5 acres").
  * If they only name the field ("change the name", "the crop is wrong", "area is not correct") set has_new_value=false and new_value_transcript=null.
- "cancel" if they want to stop without saving.
- "unclear" otherwise.
message rules: for edit with has_new_value=false, message MUST be a short question asking for the new value of that field
(e.g. "Okay, what should the field name be?"). For edit with has_new_value=true, a short acknowledgement. For confirm/cancel/unclear, one short sentence.
Return {"action": "confirm|edit|cancel|unclear", "field_id": "<id or null>", "has_new_value": true|false, "new_value_transcript": "<string or null>", "message": "<spoken sentence in the farmer's language>"}`,
          0.1
        )
        return res.status(200).json(out)
      }

      case 'daily_brief': {
        const language = String(body.language || 'en-IN')
        const out = await chatJson(
          `${BASE_SYSTEM}\n${languageInstruction(language)}
You write a daily field brief for a farmer. Be conservative: do not invent irrigation volumes, disease names, or yield.
If a fact is missing, say it is missing. Use the comparison numbers as evidence.`,
          `Farm profile: ${JSON.stringify(body.profile || {})}
Comparison of last 24 hourly summaries vs this crop/stage: ${JSON.stringify(body.comparison || {})}
Hourly summaries (oldest first): ${JSON.stringify(body.hours || [])}
Recent motor/rain events: ${JSON.stringify(body.events || [])}
Tomorrow weather (if any): ${JSON.stringify(body.weather || {})}
Yesterday brief (if any): ${JSON.stringify(body.previous || null)}

Return {
  "headline": "<one short line>",
  "today": "<what happened today, 2-4 sentences>",
  "attention": ["<condition that needs a look>"],
  "tomorrow": ["<suggested check or task for tomorrow>"],
  "missing": ["<what data is missing>"]
}`,
          0.3,
          1200
        )
        return res.status(200).json(out)
      }

      default:
        return res.status(400).json({ error: `Unknown mode '${mode}'` })
    }
  } catch (error: any) {
    console.error('[my-farm/llm]', mode, error?.message || error)
    return res.status(502).json({ error: error?.message || 'LLM request failed', mode })
  }
}
