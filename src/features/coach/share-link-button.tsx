"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]
type ButtonSize = React.ComponentProps<typeof Button>["size"]

/**
 * Botón para compartir un link público (perfil de coach o asesoría).
 * Usa la Web Share API si está disponible (móvil); si no, copia al portapapeles.
 * `path` es relativo (p.ej. `/c/felutoo` o `/c/felutoo/mi-asesoria`); el origin
 * se resuelve en el cliente.
 */
export function ShareLinkButton({
  path,
  label = "Compartir",
  shareTitle,
  variant = "outline",
  size = "sm",
  className,
}: {
  path: string
  label?: string
  shareTitle?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path

    // En móvil, abrir el menú nativo de compartir.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareTitle ? { title: shareTitle, url } : { url })
        return
      } catch (err) {
        // El usuario canceló el diálogo: no es un error.
        if (err instanceof DOMException && err.name === "AbortError") return
        // Cualquier otro fallo: caemos al copiado al portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(className)}
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {label}
    </Button>
  )
}
