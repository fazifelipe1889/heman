import Link from "next/link"
import { EphaWordmark } from "./epha-wordmark"

export function EphaLogoButton({
  href = "/dashboard",
  aria_label = "Inicio",
}: {
  href?: string
  aria_label?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
      aria-label={aria_label}
    >
      <EphaWordmark size="sm" />
    </Link>
  )
}
