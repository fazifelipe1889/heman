"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Edit2, MoreVertical, Trash2 } from "lucide-react"

import type { Supplement } from "@/lib/db/supplements"
import { getColorClasses } from "@/lib/domain/supplements"
import { WEEKDAYS } from "@/lib/domain/training"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteSupplementAction } from "./actions"

export function SupplementListItem({ s }: { s: Supplement }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const cls = getColorClasses(s.color)

  const dayLabels = WEEKDAYS.filter((d) =>
    (s.days_of_week as number[]).includes(d.value),
  ).map((d) => d.short)

  const allDays = dayLabels.length === 7

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors ${
        !s.is_active ? "opacity-50" : ""
      }`}
    >
      {/* Dot */}
      <div className={`size-3 shrink-0 rounded-full ${cls.dot}`} />

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{s.name}</span>
          {!s.is_active && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              inactivo
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {s.dose && (
            <span className={`text-xs font-medium ${cls.text}`}>{s.dose}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {allDays ? "Todos los días" : dayLabels.join(", ")}
          </span>
          {s.times_of_day.length > 0 && (
            <span className="text-xs text-muted-foreground">
              · {s.times_of_day.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Opciones"
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/supplements/${s.id}/edit`)}
          >
            <Edit2 className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`¿Eliminar "${s.name}"?`)) return
              startTransition(async () => {
                await deleteSupplementAction(s.id)
                router.refresh()
              })
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
