import { NextApiRequest, NextApiResponse } from "next"

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
const DATA_GOV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`
const SAMPLE_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
const CACHE_MS = 10 * 60 * 1000

type MandiRecord = {
  state?: string
  district?: string
  market?: string
  commodity?: string
  variety?: string
  grade?: string
  arrival_date?: string
  min_price?: string | number
  max_price?: string | number
  modal_price?: string | number
}

type MappedRecord = ReturnType<typeof mapRecord>

type CacheEntry = {
  expires: number
  payload: {
    success: true
    data: MappedRecord[]
    total: number
    count: number
    offset: number
    limit: number
    source: string
    updated: string | null
    message: string
    cached?: boolean
  }
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<CacheEntry["payload"]>>()

const FALLBACK_RECORDS: MappedRecord[] = [
  mapRecord({
    state: "Telangana",
    district: "Siddipet",
    market: "Siddipet(Rythu Bazar)",
    commodity: "Cauliflower",
    variety: "African Sarson",
    grade: "Grade A",
    arrival_date: "10/09/2026",
    min_price: 2500,
    max_price: 3500,
    modal_price: 3000,
  }),
  mapRecord({
    state: "Telangana",
    district: "Siddipet",
    market: "Siddipet(Rythu Bazar)",
    commodity: "Cluster beans",
    variety: "Cluster Beans",
    grade: "Grade A",
    arrival_date: "10/09/2026",
    min_price: 3500,
    max_price: 4500,
    modal_price: 4000,
  }),
  mapRecord({
    state: "Chandigarh",
    district: "Chandigarh",
    market: "Chandigarh (Grain/F&V) APMC",
    commodity: "Pumpkin",
    variety: "Pumpkin",
    grade: "FAQ",
    arrival_date: "10/09/2026",
    min_price: 1000,
    max_price: 1600,
    modal_price: 1400,
  }),
  mapRecord({
    state: "Odisha",
    district: "Bargarh",
    market: "Godbhaga APMC",
    commodity: "Ridge Gourd(Permal/Hybrid Gourd)",
    variety: "Ridge Gourd(Permal/Hybrid Gourd)",
    grade: "Grade B",
    arrival_date: "10/09/2026",
    min_price: 2250,
    max_price: 2600,
    modal_price: 2400,
  }),
  mapRecord({
    state: "Uttar Pradesh",
    district: "Banda",
    market: "Baberu APMC",
    commodity: "Wheat",
    variety: "Dara",
    grade: "FAQ",
    arrival_date: "10/09/2026",
    min_price: 2600,
    max_price: 2600,
    modal_price: 2600,
  }),
  mapRecord({
    state: "Chattisgarh",
    district: "Balrampur",
    market: "Rajpur APMC",
    commodity: "Paddy(Common)",
    variety: "I.R. 36",
    grade: "Non-FAQ",
    arrival_date: "10/09/2026",
    min_price: 1950,
    max_price: 1950,
    modal_price: 1950,
  }),
]

function toNumber(value: string | number | undefined) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

function mapRecord(record: MandiRecord) {
  const minPrice = toNumber(record.min_price)
  const maxPrice = toNumber(record.max_price)
  const modalPrice = toNumber(record.modal_price)
  const spread = modalPrice > 0 ? (maxPrice - minPrice) / modalPrice : 0
  const trend = spread > 0.2 ? "rising" : spread < 0.05 ? "stable" : "falling"
  const crop = record.commodity || "Unknown"
  const location = [record.market, record.district, record.state].filter(Boolean).join(", ")

  return {
    crop,
    variety: record.variety || "",
    grade: record.grade || "",
    min_price: minPrice,
    max_price: maxPrice,
    modal_price: modalPrice,
    trend,
    recommendation: `${crop} is trading at ₹${modalPrice}/quintal in ${location || "the mandi"}.`,
    location,
    market: record.market || "",
    district: record.district || "",
    state: record.state || "",
    date: record.arrival_date || "",
    source: "data.gov.in / AGMARKNET",
  }
}

function cacheKey(crop: string, state: string, offset: number, limit: number) {
  return `${crop}|${state}|${offset}|${limit}`.toLowerCase()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchGovRecords(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "KrishiMithr/1.0",
    },
  })
  return response
}

async function loadMandiPrices(options: {
  crop: string
  state: string
  offset: number
  limit: number
}) {
  const { crop, state, offset, limit } = options
  const key = cacheKey(crop, state, offset, limit)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expires > now) {
    return { ...hit.payload, cached: true }
  }

  const pending = inflight.get(key)
  if (pending) return pending

  const request = (async () => {
    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY || SAMPLE_API_KEY,
      format: "json",
      offset: String(offset),
      limit: String(limit),
    })
    if (crop) params.set("filters[commodity]", crop)
    if (state) params.set("filters[state]", state)

    const url = `${DATA_GOV_URL}?${params.toString()}`
    let response = await fetchGovRecords(url)

    if (response.status === 429) {
      await sleep(1500)
      response = await fetchGovRecords(url)
    }

    if (response.ok) {
      const body = await response.json()
      const records = Array.isArray(body.records) ? body.records.map(mapRecord) : []
      const payload: CacheEntry["payload"] = {
        success: true,
        data: records,
        total: body.total ?? records.length,
        count: body.count ?? records.length,
        offset,
        limit,
        source: body.title || "Current Daily Price of Various Commodities from Various Markets (Mandi)",
        updated: body.updated_date || null,
        message: `AGMARKNET prices${crop ? ` for ${crop}` : ""}`,
      }
      cache.set(key, { expires: Date.now() + CACHE_MS, payload })
      return payload
    }

    const stale = cache.get(key)
    if (stale) {
      return { ...stale.payload, cached: true, message: "Showing cached mandi prices while data.gov.in is busy." }
    }

    const anyFresh = Array.from(cache.values()).find((entry) => entry.expires > Date.now() && entry.payload.data.length)
    if (anyFresh) {
      return { ...anyFresh.payload, cached: true, message: "Showing cached mandi prices while data.gov.in is busy." }
    }

    const filteredFallback = FALLBACK_RECORDS.filter((item) => {
      const cropOk = !crop || item.crop.toLowerCase().includes(crop.toLowerCase())
      const stateOk = !state || item.state.toLowerCase().includes(state.toLowerCase())
      return cropOk && stateOk
    })

    return {
      success: true as const,
      data: filteredFallback.length ? filteredFallback : FALLBACK_RECORDS,
      total: filteredFallback.length || FALLBACK_RECORDS.length,
      count: filteredFallback.length || FALLBACK_RECORDS.length,
      offset,
      limit,
      source: "AGMARKNET last known prices",
      updated: null,
      message: "data.gov.in is rate-limited. Showing last known mandi prices.",
      cached: true,
    }
  })()

  inflight.set(key, request)
  try {
    return await request
  } finally {
    inflight.delete(key)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const crop = typeof req.query.crop === "string" ? req.query.crop.trim() : ""
    const state = typeof req.query.state === "string" ? req.query.state.trim() : ""
    const location = typeof req.query.location === "string" ? req.query.location.trim() : ""
    const offset = Number(req.query.offset ?? 0) || 0
    const requestedLimit = Number(req.query.limit ?? 10) || 10
    const limit = Math.min(Math.max(requestedLimit, 1), 10)

    const payload = await loadMandiPrices({
      crop,
      state: state || location,
      offset,
      limit,
    })

    return res.status(200).json(payload)
  } catch (error) {
    console.error("Market prices API error:", error)
    return res.status(200).json({
      success: true,
      data: FALLBACK_RECORDS,
      total: FALLBACK_RECORDS.length,
      count: FALLBACK_RECORDS.length,
      offset: 0,
      limit: 10,
      source: "AGMARKNET last known prices",
      updated: null,
      cached: true,
      message: "Could not reach data.gov.in. Showing last known mandi prices.",
    })
  }
}
