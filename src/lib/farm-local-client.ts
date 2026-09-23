const KEY = "km_farm_profile"

export function snapshotFromAnswers(
  answers: Record<string, any> | undefined,
  detected: {
    lat?: number | null
    lon?: number | null
    accuracy?: number | null
    village?: string | null
    district?: string | null
    state?: string | null
    display?: string | null
  } | null,
  language: string
) {
  const a = (id: string) => answers?.[id]
  const d = (id: string) => (a(id)?.details || {}) as Record<string, any>
  const loc = d("location")
  return {
    setupComplete: true,
    field_id: "local",
    fieldName: a("field_name")?.value || null,
    crop: a("crop")?.value || null,
    cropLocal: d("crop").crop_local || null,
    variety: a("variety")?.unknown ? null : a("variety")?.value || null,
    location: {
      village: loc.village || detected?.village || null,
      district: loc.district || detected?.district || null,
      state: loc.state || detected?.state || null,
      confirmedGps: Boolean(loc.confirmed_gps),
      lat: detected?.lat ?? null,
      lon: detected?.lon ?? null,
      accuracyM: detected?.accuracy ?? null,
      display: detected?.display || null,
    },
    area: {
      value: d("area").number ?? null,
      unit: d("area").unit || null,
      spoken: a("area")?.value || null,
    },
    sowing: {
      date: d("sowing").date_iso || null,
      approximate: Boolean(d("sowing").approximate),
      method: d("sowing").method || null,
      spoken: a("sowing")?.value || null,
    },
    growthStage: d("stage").stage || a("stage")?.value || null,
    soilType: a("soil")?.unknown ? null : d("soil").soil || a("soil")?.value || null,
    irrigationMethod: d("irrigation").method || a("irrigation")?.value || null,
    language,
    answers,
    deviceId: "esp32_goa",
    timezone: "Asia/Kolkata",
  }
}

export function saveFarmLocal(profile: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...profile, setupComplete: true, savedAt: new Date().toISOString() }))
  } catch {
    /* ignore quota */
  }
}

export function loadFarmLocal(): any | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const doc = JSON.parse(raw)
    return doc && typeof doc === "object" ? doc : null
  } catch {
    return null
  }
}
