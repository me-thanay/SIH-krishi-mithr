"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import NavigationMenuWithActiveItem from "@/components/ui/navigation-menu-05"
import { useAuth } from "@/contexts/AuthContext"

function clearOperationsHash(event: React.MouseEvent) {
  if (typeof window === "undefined") return
  if (window.location.pathname === "/" && window.location.hash === "#operations") {
    event.preventDefault()
    window.history.pushState(null, "", "/")
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  }
}

type NewNavbarProps = {
  /** `hero` = white text on the landing image. `solid` = dark text on a light bar. */
  variant?: "hero" | "solid"
}

function AuthActions({ inverted }: { inverted: boolean }) {
  const { isAuthenticated, user, showAuthModal, logout, isLoading } = useAuth()

  if (isLoading) {
    return <div className="h-9 w-20 shrink-0" />
  }

  if (isAuthenticated) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden max-w-[9rem] truncate text-sm sm:inline",
            inverted ? "text-white/90" : "text-gray-600"
          )}
        >
          {user?.phone ? `••••${user.phone.slice(-4)}` : user?.name || "Signed in"}
        </span>
        <button
          type="button"
          onClick={logout}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            inverted
              ? "border border-white/40 text-white hover:bg-white/10"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => showAuthModal("signup")}
        className={cn(
          "hidden rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:inline-flex",
          inverted ? "text-white/90 hover:text-white" : "text-gray-600 hover:text-gray-900"
        )}
      >
        Sign up
      </button>
      <button
        type="button"
        onClick={() => showAuthModal("login")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          inverted
            ? "bg-white text-gray-900 hover:bg-white/90"
            : "bg-green-600 text-white hover:bg-green-700"
        )}
      >
        Sign in
      </button>
    </div>
  )
}

export function NewNavbar({ variant = "solid" }: NewNavbarProps) {
  const isHero = variant === "hero"

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[1100]",
        isHero
          ? "border-transparent bg-transparent text-white"
          : "border-b border-border/60 bg-white/95 text-gray-900 shadow-sm backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={clearOperationsHash}
          className="shrink-0 text-lg font-bold text-current sm:text-xl"
        >
          Krishi Mithr
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <NavigationMenuWithActiveItem inverted={isHero} />
          <AuthActions inverted={isHero} />
        </div>
      </div>
    </header>
  )
}

export default NewNavbar
