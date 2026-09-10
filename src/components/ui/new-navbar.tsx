"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import NavigationMenuWithActiveItem from "@/components/ui/navigation-menu-05"

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
        <NavigationMenuWithActiveItem inverted={isHero} />
      </div>
    </header>
  )
}

export default NewNavbar
