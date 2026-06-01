"use client"

import * as React from "react"
import { Check } from "lucide-react"

import type { Supplement } from "@/lib/db/supplements"
import { getColorClasses } from "@/lib/domain/supplements"
import { toggleSupplementLogAction } from "./actions"

type Props = {
  supplements: Supplement[]
  takenIds: string[]   // IDs de suplementos ya marcados hoy
  logDate: string      // YYYY-MM-DD
}

export function SupplementChecklist({ supplements, takenIds, logDate }: Props) {
  const [optimisticTaken, setOptimisticTaken] = React.useState<Set<string>>(
    () => new Set(takenIds),
  )
  const [pending, setPending] = React.useState<Set<string>>(new Set())

  async function toggle(id: string) {
    if (pending.has(id)) return
    const wasTaken = optimisticTaken.has(id)

    // Optimistic update
    setOptimisticTaken((prev) => {
      const next = new Set(prev)
      if (wasTaken) { next.delete(id) } else { next.add(id) }
      return next
    })
    setPending((prev) => new Set(prev).add(id))

    await toggleSupplementLogAction(id, logDate, wasTaken)

    setPending((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  if (supplements.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No tenés suplementos programados para hoy.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {supplements.map((s) => {
        const taken = optimisticTaken.has(s.id)
        const isLoading = pending.has(s.id)
        const cls = getColorClasses(s.color)

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            disabled={isLoading}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
              taken
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-border bg-card hover:border-primary/30"
            } ${isLoading ? "opacity-60" : ""}`}
          >
            {/* Dot de color */}
            <div
              className={`size-3 shrink-0 rounded-full ${cls.dot} ${taken ? "" : "opacity-40"}`}
            />

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`font-medium leading-tight ${
                  taken ? "line-through text-muted-foreground" : ""
                }`}
              >
                {s.name}
              </span>
              {(s.dose || s.times_of_day.length > 0) && (
                <span className="text-xs text-muted-foreground">
                  {[s.dose, s.times_of_day.join(" · ")].filter(Boolean).join("  ·  ")}
                </span>
              )}
            </div>

            {/* Check */}
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                taken
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30"
              }`}
            >
              {taken && <Check className="size-4" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
