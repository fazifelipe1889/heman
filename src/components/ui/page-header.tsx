import * as React from "react"
import Link from "next/link"
import { ArrowLeft, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  /** Ícono representativo de la sección. */
  icon?: LucideIcon
  title: string
  /** Bajada opcional. Omitila si no agrega información al título. */
  description?: string
  /** Estilo de la caja del ícono. */
  iconVariant?: "muted" | "primary"
  /** Acción a la derecha (ej. botón "Agregar"). */
  action?: React.ReactNode
  /** Link "volver" arriba del título. */
  backHref?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  iconVariant = "muted",
  action,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              iconVariant === "primary"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            <Icon className="size-6" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {action && <div className="shrink-0 self-center">{action}</div>}
      </div>
    </div>
  )
}
