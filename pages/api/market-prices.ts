import { NextApiRequest, NextApiResponse } from "next"

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
const DATA_GOV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`
const SAMPLE_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

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

    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY || SAMPLE_API_KEY,
      format: "json",
      offset: String(offset),
      limit: String(limit),
    })

    if (crop) params.set("filters[commodity]", crop)
    if (state || location) params.set("filters[state]", state || location)

    const response = await fetch(`${DATA_GOV_URL}?${params.toString()}`)
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch mandi prices from data.gov.in",
      })
    }

    const body = await response.json()
    const records = Array.isArray(body.records) ? body.records.map(mapRecord) : []

    return res.status(200).json({
      success: true,
      data: records,
      total: body.total ?? records.length,
      count: body.count ?? records.length,
      offset,
      limit,
      source: body.title || "Current Daily Price of Various Commodities from Various Markets (Mandi)",
      updated: body.updated_date || null,
      message: `AGMARKNET prices${crop ? ` for ${crop}` : ""}`,
    })
  } catch (error) {
    console.error("Market prices API error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
}
