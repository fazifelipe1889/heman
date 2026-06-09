import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Spinner — símbolo de carga reutilizable.
 * Centraliza el patrón `<Loader2 className="animate-spin" />` usado inline
 * en formularios y acciones. Hereda el color actual (`currentColor`).
 */
function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      role="status"
      aria-label="Cargando"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
