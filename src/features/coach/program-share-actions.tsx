"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Copy, ExternalLink } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonSize = React.ComponentProps<typeof Button>["size"]

/**
 * CTA principal de un producto en el panel de coach: copiar al portapapeles el
 * link público que el coach comparte con sus clientes, más un acceso a la
 * landing en una pestaña nueva.
 *
 * `path` es relativo (p.ej. `/c/felutoo/mi-asesoria`); el origin se resuelve en
 * el cliente para que el link copiado funcione en cualquier entorno.
 */
export function ProgramShareActions({
  path,
  size = "sm",
  className,
}: {
  path: string
  size?: ButtonSize
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("¡Link copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" size={size} onClick={handleCopy} className="flex-1">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "¡Copiado!" : "Copiar link"}
      </Button>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size }))}
      >
        <ExternalLink className="size-4" /> Ver landing
      </a>
    </div>
  )
}
