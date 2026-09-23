/** After login/signup: farm setup if missing, otherwise dashboard. */
export async function routeAfterAuth() {
  if (typeof window === "undefined") return
  const token = localStorage.getItem("auth_token")
  if (!token) {
    window.location.href = "/my-farm?setup=1"
    return
  }
  try {
    const r = await fetch("/api/farm/setup-status", { headers: { Authorization: `Bearer ${token}` } })
    const j = await r.json().catch(() => ({}))
    const localDone =
      typeof window !== "undefined" &&
      (() => {
        try {
          const raw = localStorage.getItem("km_farm_profile")
          return raw ? Boolean(JSON.parse(raw)?.setupComplete) : false
        } catch {
          return false
        }
      })()
    if (j.setupComplete || localDone) window.location.href = "/dashboard"
    else window.location.href = "/my-farm?setup=1"
  } catch {
    window.location.href = "/my-farm?setup=1"
  }
}
