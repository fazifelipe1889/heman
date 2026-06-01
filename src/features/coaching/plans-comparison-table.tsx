import { Check, X } from "lucide-react"

import { readPerks, formatMoney } from "@/lib/domain/coaching"
import type { CoachingPlan } from "@/lib/supabase/types"

/**
 * Tabla comparativa de planes: perks en filas, planes en columnas.
 * Solo renderiza si hay ≥2 planes.
 */
export function PlansComparisonTable({ plans }: { plans: CoachingPlan[] }) {
  if (plans.length < 2) return null

  // Extraer todos los perks únicos mencionados
  const allPerks = [
    { key: "chat", label: "Chat con el coach" },
    { key: "video_calls", label: "Videollamadas" },
    { key: "routine", label: "Rutina personalizada" },
    { key: "supplements", label: "Plan de suplementos" },
    { key: "progress_sharing", label: "Seguimiento de progreso" },
  ]

  const hasPerkInAnyPlan = allPerks.filter((p) =>
    plans.some((plan) => {
      const perks = readPerks(plan.perks)
      if (p.key === "chat") return perks.chat.enabled
      if (p.key === "video_calls") return perks.video_calls.count > 0
      if (p.key === "routine") return perks.routine.enabled
      if (p.key === "supplements") return perks.supplements.enabled
      if (p.key === "progress_sharing") return perks.progress_sharing.enabled
      return false
    })
  )

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Características</th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-3 py-3 text-center font-semibold">
                <div className="text-sm font-medium">{plan.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatMoney(plan.price_cents, plan.currency)}
                </div>
                {plan.price_usd_cents != null && (
                  <div className="text-[11px] text-muted-foreground">
                    {formatMoney(plan.price_usd_cents, "USD")}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasPerkInAnyPlan.map((perk) => {
            const hasAnyPlan = plans.some((plan) => {
              const perks = readPerks(plan.perks)
              if (perk.key === "chat") return perks.chat.enabled
              if (perk.key === "video_calls") return perks.video_calls.count > 0
              if (perk.key === "routine") return perks.routine.enabled
              if (perk.key === "supplements") return perks.supplements.enabled
              if (perk.key === "progress_sharing") return perks.progress_sharing.enabled
              return false
            })

            if (!hasAnyPlan) return null

            return (
              <tr key={perk.key} className="border-b">
                <td className="px-4 py-3 text-sm font-medium">{perk.label}</td>
                {plans.map((plan) => {
                  const perks = readPerks(plan.perks)
                  let included = false
                  let detail = ""

                  if (perk.key === "chat" && perks.chat.enabled) {
                    included = true
                  } else if (perk.key === "video_calls" && perks.video_calls.count > 0) {
                    included = true
                    detail = `${perks.video_calls.count}x ${perks.video_calls.minutes}min`
                  } else if (perk.key === "routine" && perks.routine.enabled) {
                    included = true
                    if (perks.routine.reconfigs_included > 0) {
                      detail = `${perks.routine.reconfigs_included} reconfigs`
                    }
                  } else if (perk.key === "supplements" && perks.supplements.enabled) {
                    included = true
                  } else if (perk.key === "progress_sharing" && perks.progress_sharing.enabled) {
                    included = true
                  }

                  return (
                    <td
                      key={`${plan.id}-${perk.key}`}
                      className="px-3 py-3 text-center"
                    >
                      {included ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Check className="size-4 text-primary" />
                          {detail && (
                            <span className="text-[11px] text-muted-foreground">
                              {detail}
                            </span>
                          )}
                        </div>
                      ) : (
                        <X className="mx-auto size-4 text-muted-foreground/40" />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
