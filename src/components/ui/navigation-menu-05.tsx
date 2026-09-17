"use client"

import { useEffect, useState } from "react";
import { BookOpen, Bug, Home, Rss } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navigationMenuItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Diagnose", href: "/pest-demo", icon: Bug },
  { title: "Market", href: "/market-prices", icon: Rss },
  { title: "Analyze", href: "/dashboard", icon: BookOpen },
];

function goToLanding(event: React.MouseEvent) {
  if (typeof window === "undefined") return
  if (window.location.pathname === "/" && window.location.hash === "#operations") {
    event.preventDefault()
    window.history.pushState(null, "", "/")
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  }
}

export default function NavigationMenuWithActiveItem({
  inverted = false,
}: {
  inverted?: boolean
}) {
  const router = useRouter();
  const pathname = router.pathname || "/";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList className="space-x-4 sm:space-x-8">
        {navigationMenuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" && hash !== "#operations"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink
                active={isActive}
                asChild
                className={cn(
                  "group relative inline-flex h-9 w-max items-center justify-center px-0.5 py-2 font-medium text-sm",
                  inverted ? "text-white" : "text-gray-900",
                  "before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:origin-center before:scale-x-0 before:bg-primary before:transition-transform",
                  inverted
                    ? "hover:text-white hover:before:scale-x-100"
                    : "hover:text-gray-900 hover:before:scale-x-100",
                  "focus:text-accent-foreground focus:outline-none focus:before:scale-x-100",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "data-[active]:bg-transparent data-[active]:before:scale-x-100",
                  "hover:bg-transparent focus:bg-transparent active:bg-transparent",
                )}
              >
                <Link
                  className="flex flex-row items-center gap-2.5"
                  href={item.href}
                  onClick={item.href === "/" ? goToLanding : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
