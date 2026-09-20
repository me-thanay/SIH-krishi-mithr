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
    if (j.setupComplete) window.location.href = "/dashboard"
    else window.location.href = "/my-farm?setup=1"
  } catch {
    window.location.href = "/my-farm?setup=1"
  }
}
