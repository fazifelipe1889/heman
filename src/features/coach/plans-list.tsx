"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2, EyeOff } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatMoney, isPerkEnabled, readPerks } from "@/lib/domain/coaching"
import type { CoachingPlan } from "@/lib/supabase/types"
import { deletePlanAction } from "./actions"

function perkSummary(plan: CoachingPlan): string[] {
  const perks = readPerks(plan.perks)
  const list: string[] = []
  if (isPerkEnabled(perks, "chat")) list.push("Chat")
  if (perks.video_calls.count > 0) list.push(`${perks.video_calls.count} videollamadas`)
  if (isPerkEnabled(perks, "routine")) list.push("Rutina")
  if (isPerkEnabled(perks, "supplements")) list.push("Suplementos")
  if (isPerkEnabled(perks, "progress_sharing")) list.push("Progreso")
  return list
}

export function PlansList({
  programId,
  plans,
}: {
  programId: string
  plans: CoachingPlan[]
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleDelete(planId: string) {
    setDeletingId(planId)
    startTransition(async () => {
      const res = await deletePlanAction(planId, programId)
      setDeletingId(null)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Plan eliminado")
      router.refresh()
    })
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste planes. Creá al menos uno para poder publicar.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  {!plan.is_visible && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <EyeOff className="size-3" /> Oculto
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatMoney(plan.price_cents, plan.currency)} · {plan.duration_days} días
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/coach/programs/${programId}/plans/${plan.id}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  aria-label="Editar plan"
                >
                  <Pencil className="size-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  disabled={isPending && deletingId === plan.id}
                  onClick={() => handleDelete(plan.id)}
                  aria-label="Eliminar plan"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {perkSummary(plan).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {perkSummary(plan).map((p) => (
                  <Badge key={p} variant="secondary" className="text-[11px]">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
