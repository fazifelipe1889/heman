"use client"

import { useRouter } from "next/navigation"
import { EphaWordmark } from "./epha-wordmark"

export function EphaLogoButton({
  href = "/dashboard",
  aria_label = "Inicio",
}: {
  href?: string
  aria_label?: string
}) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
      aria-label={aria_label}
    >
      <EphaWordmark size="sm" />
    </button>
  )
}
