"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { COACH_TABS } from "./coach-nav-items"

/**
 * Sidebar del panel del coach. Solo visible en desktop (lg:). En mobile la
 * navegación la sigue resolviendo `CoachNav` (barra superior). Sticky bajo el
 * header de la app (h-14) y ocupa el alto del viewport.
 */
export function CoachSidebar({
  displayName,
  handle,
  avatarUrl,
}: {
  displayName: string
  handle: string
  avatarUrl: string | null
}) {
  const pathname = usePathname()
  const initial = displayName.trim().charAt(0).toUpperCase() || "?"

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col border-r bg-background/95 lg:flex">
      {/* Identidad — atajo a la configuración del perfil */}
      <Link
        href="/coach/settings"
        className="flex items-center gap-3 border-b px-4 py-4 transition-colors hover:bg-muted/50"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">
            {displayName}
          </span>
          <span className="truncate text-xs text-muted-foreground">@{handle}</span>
        </div>
      </Link>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {COACH_TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
