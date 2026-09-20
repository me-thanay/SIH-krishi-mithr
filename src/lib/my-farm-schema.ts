/** Shared My Farm questionnaire definition (client + API). */

export type FieldKind =
  | 'text'
  | 'crop'
  | 'variety'
  | 'location'
  | 'area'
  | 'sowing'
  | 'stage'
  | 'soil'
  | 'irrigation'

export interface FarmQuestion {
  id: string
  kind: FieldKind
  /** Canonical English wording (source for translation). */
  question: string
  /** What the answer captures — shown as the form label. */
  label: string
  /** Extraction hints for the LLM. */
  hint: string
  allowUnknown?: boolean
}

export const FARM_QUESTIONS: FarmQuestion[] = [
  {
    id: 'field_name',
    kind: 'text',
    question: 'What would you like to name this field?',
    label: 'Field name',
    hint: 'A short nickname for the plot, e.g. "North field", "Well side plot". Keep the farmer\'s own words.',
  },
  {
    id: 'crop',
    kind: 'crop',
    question: 'Which crop are you growing?',
    label: 'Crop',
    hint: 'Common crop name. Normalize value to the English crop name (e.g. paddy/rice -> "Rice", mirchi -> "Chilli").',
  },
  {
    id: 'variety',
    kind: 'variety',
    question: 'Do you know the crop variety?',
    label: 'Variety',
    hint: 'Seed/variety name such as "BPT 5204", "Pusa Basmati", "hybrid". Farmer may say they do not know.',
    allowUnknown: true,
  },
  {
    id: 'location',
    kind: 'location',
    question: 'Where is this field located?',
    label: 'Location (village, district, state)',
    hint: 'Village, district, state. If GPS-detected location is provided in context and farmer confirms, use it.',
  },
  {
    id: 'area',
    kind: 'area',
    question: "What is the field's area? Please mention acres, hectares, or another unit.",
    label: 'Area and unit',
    hint: 'Number plus unit. Accept acres, hectares, guntas, cents, bigha, kanal, katha. Keep the unit the farmer used.',
  },
  {
    id: 'sowing',
    kind: 'sowing',
    question: 'When did you sow or transplant the crop?',
    label: 'Sowing / transplant date and method',
    hint: 'Convert relative dates ("two weeks ago", "last month", "on Diwali") to an ISO date using today\'s date in context. Method: sowing, transplanting, direct seeding, etc.',
  },
  {
    id: 'stage',
    kind: 'stage',
    question: 'What stage is the crop at—seedling, growing leaves, flowering, or developing fruits or grains?',
    label: 'Growth stage',
    hint: 'One of: seedling, vegetative, flowering, fruiting/grain-filling, maturity/harvest. Adapt wording to the crop.',
  },
  {
    id: 'soil',
    kind: 'soil',
    question: 'Do you know your soil type?',
    label: 'Soil type',
    hint: 'Black, red, sandy, loamy, clay, alluvial, laterite. Farmer may say unknown.',
    allowUnknown: true,
  },
  {
    id: 'irrigation',
    kind: 'irrigation',
    question: 'How do you water the crop—drip, sprinkler, surface irrigation, or rain only?',
    label: 'Irrigation method',
    hint: 'One of: drip, sprinkler, surface/flood/canal, rain-fed, borewell flood, other.',
  },
]

export interface SupportedLanguage {
  /** BCP-47 tag used for speech recognition + synthesis. */
  code: string
  name: string
  native: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-IN', name: 'English', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
]

export function languageByCode(code: string | null | undefined): SupportedLanguage {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0]
}

export interface Answer {
  value: string | null
  display: string
  unknown: boolean
  details: Record<string, unknown>
  transcript: string
}

export type Answers = Record<string, Answer>

export interface DetectedLocation {
  lat: number
  lon: number
  accuracy?: number
  village?: string
  district?: string
  state?: string
  country?: string
  display?: string
}
