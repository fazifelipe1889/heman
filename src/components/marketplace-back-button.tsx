"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

/**
 * Botón de retroceso para el área pública /c/*.
 * Usa hrefs explícitos (no router.back) porque las páginas de coach
 * pueden abrirse desde links externos sin historial previo.
 */
export function MarketplaceBackButton() {
  const pathname = usePathname()

  // /c → estamos en el raíz, no hay para atrás
  if (pathname === "/c" || pathname === "/c/") return null

  // Deriva la ruta padre eliminando el último segmento.
  // /c/handle         → /c
  // /c/handle/slug    → /c/handle
  // /c/handle/slug/checkout → /c/handle/slug
  const segments = pathname.split("/").filter(Boolean)
  const parentPath = "/" + segments.slice(0, -1).join("/")

  return (
    <Link
      href={parentPath}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Volver"
    >
      <ArrowLeft className="size-5" />
    </Link>
  )
}
