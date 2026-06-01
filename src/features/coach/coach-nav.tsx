"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Dumbbell, Users, Wallet, UserCog } from "lucide-react"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/coach", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/coach/programs", label: "Asesorías", icon: Dumbbell, exact: false },
  { href: "/coach/clients", label: "Clientes", icon: Users, exact: false },
  { href: "/coach/earnings", label: "Ingresos", icon: Wallet, exact: false },
  { href: "/coach/settings", label: "Perfil", icon: UserCog, exact: false },
]

export function CoachNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-14 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center gap-1 overflow-x-auto px-2 py-2">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
