import Link from "next/link"
import { Check, MessageCircle, Video, Dumbbell, Pill, LineChart, Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatMoney, readPerks } from "@/lib/domain/coaching"
import type { CoachingPlan } from "@/lib/supabase/types"

/** Lista de perks legibles con ícono. */
function perkLines(plan: CoachingPlan) {
  const perks = readPerks(plan.perks)
  const lines: { icon: React.ElementType; label: string }[] = []
  if (perks.chat.enabled)
    lines.push({ icon: MessageCircle, label: "Chat directo con el coach" })
  if (perks.video_calls.count > 0)
    lines.push({
      icon: Video,
      label: `${perks.video_calls.count} videollamada${perks.video_calls.count > 1 ? "s" : ""}${
        perks.video_calls.minutes ? ` de ${perks.video_calls.minutes} min` : ""
      }`,
    })
  if (perks.routine.enabled)
    lines.push({ icon: Dumbbell, label: "Rutina personalizada" })
  if (perks.supplements.enabled)
    lines.push({ icon: Pill, label: "Plan de suplementación" })
  if (perks.progress_sharing.enabled)
    lines.push({ icon: LineChart, label: "Seguimiento de tu progreso" })
  return lines
}

export function PlanPurchaseCard({
  plan,
  handle,
  slug,
  highlight,
  recommended,
}: {
  plan: CoachingPlan
  handle: string
  slug: string
  highlight?: boolean
  /** Resaltado por el quiz como el plan ideal para el visitante. */
  recommended?: boolean
}) {
  const lines = perkLines(plan)
  const ring = recommended || highlight

  return (
    <Card
      id={`plan-${plan.id}`}
      className={cn("scroll-mt-20", ring && "ring-2 ring-primary")}
    >
      <CardContent className="flex flex-col gap-4 py-5">
        {recommended && (
          <span className="flex items-center gap-1.5 self-start rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            <Sparkles className="size-3.5" />
            Recomendado para vos
          </span>
        )}
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{plan.name}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight">
              {formatMoney(plan.price_cents, plan.currency)}
            </span>
            {plan.price_usd_cents != null && (
              <span className="text-sm text-muted-foreground">
                / {formatMoney(plan.price_usd_cents, "USD")}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              · {plan.duration_days} días
            </span>
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>

        {lines.length > 0 && (
          <ul className="flex flex-col gap-2">
            {lines.map((l, i) => {
              const Icon = l.icon
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-primary" />
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{l.label}</span>
                </li>
              )
            })}
          </ul>
        )}

        <Button
          size="lg"
          className="h-11 w-full"
          variant={ring ? "default" : "outline"}
          render={
            <Link href={`/c/${handle}/${slug}/checkout?plan=${plan.id}`} />
          }
        >
          Contratar
        </Button>
      </CardContent>
    </Card>
  )
}
