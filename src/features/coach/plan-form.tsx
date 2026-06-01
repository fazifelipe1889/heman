"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { MessageCircle, Video, Dumbbell, Pill, LineChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { NumberField, TextField, TextAreaField } from "@/features/routines/fields"
import { cn } from "@/lib/utils"
import { readPerks } from "@/lib/domain/coaching"
import type { CoachingPlan } from "@/lib/supabase/types"
import { createPlanAction, updatePlanAction } from "./actions"
import { planSchema, type PlanValues } from "./schema"

type Props = {
  programId: string
  plan?: CoachingPlan
}

/** Fila de perk con switch. */
function PerkRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 text-left"
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <span
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-background transition-transform",
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
      {enabled && children}
    </div>
  )
}

export function PlanForm({ programId, plan }: Props) {
  const isEdit = Boolean(plan)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const existingPerks = plan ? readPerks(plan.perks) : null

  const form = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      price: plan ? plan.price_cents / 100 : undefined,
      durationDays: plan?.duration_days ?? 30,
      chatEnabled: existingPerks?.chat.enabled ?? false,
      videoCallsCount: existingPerks?.video_calls.count ?? 0,
      videoCallMinutes: existingPerks?.video_calls.minutes ?? 0,
      routineEnabled: existingPerks?.routine.enabled ?? false,
      routineReconfigs: existingPerks?.routine.reconfigs_included ?? 0,
      supplementsEnabled: existingPerks?.supplements.enabled ?? false,
      progressSharingEnabled: existingPerks?.progress_sharing.enabled ?? false,
      isVisible: plan?.is_visible ?? true,
    },
  })

  const w = useWatch({ control: form.control })

  function toggle(field: keyof PlanValues) {
    form.setValue(field, !form.getValues(field) as never, { shouldDirty: true })
  }

  function onSubmit(values: PlanValues) {
    startTransition(async () => {
      const res = isEdit
        ? await updatePlanAction(plan!.id, programId, values)
        : await createPlanAction(programId, values)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? "Plan actualizado" : "Plan creado")
      router.push(`/coach/programs/${programId}`)
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5 pb-28">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField name="name" label="Nombre del plan" placeholder="Ej: Base, Premium, VIP" />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Qué incluye este plan…"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField name="price" label="Precio (ARS)" min={0} />
                <NumberField name="durationDays" label="Duración (días)" min={1} />
              </div>
            </CardContent>
          </Card>

          {/* Perks */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Qué incluye el plan</p>

            <PerkRow
              icon={MessageCircle}
              title="Chat con el coach"
              description="Mensajería directa mientras dure la asesoría"
              enabled={w.chatEnabled ?? false}
              onToggle={() => toggle("chatEnabled")}
            />

            <PerkRow
              icon={Video}
              title="Videollamadas"
              description="Sesiones de seguimiento por video"
              enabled={(w.videoCallsCount ?? 0) > 0}
              onToggle={() =>
                form.setValue(
                  "videoCallsCount",
                  (w.videoCallsCount ?? 0) > 0 ? 0 : 2,
                  { shouldDirty: true }
                )
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <NumberField name="videoCallsCount" label="Cantidad" min={0} max={100} />
                <NumberField name="videoCallMinutes" label="Min. c/u" min={0} max={240} />
              </div>
            </PerkRow>

            <PerkRow
              icon={Dumbbell}
              title="Rutina personalizada"
              description="El coach te asigna una rutina a medida"
              enabled={w.routineEnabled ?? false}
              onToggle={() => toggle("routineEnabled")}
            >
              <NumberField
                name="routineReconfigs"
                label="Reconfiguraciones incluidas"
                min={0}
                max={52}
              />
            </PerkRow>

            <PerkRow
              icon={Pill}
              title="Plan de suplementación"
              description="Guía de suplementos personalizada"
              enabled={w.supplementsEnabled ?? false}
              onToggle={() => toggle("supplementsEnabled")}
            />

            <PerkRow
              icon={LineChart}
              title="Seguimiento de progreso"
              description="El coach ve tu progreso para ajustar"
              enabled={w.progressSharingEnabled ?? false}
              onToggle={() => toggle("progressSharingEnabled")}
            />
          </div>

          {/* Visibilidad */}
          <Card>
            <CardContent className="pt-6">
              <PerkRow
                icon={Dumbbell}
                title="Visible en la asesoría"
                description="Si lo desactivás, el plan queda oculto al público"
                enabled={w.isVisible ?? true}
                onToggle={() => toggle("isVisible")}
              />
            </CardContent>
          </Card>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4 py-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-base"
              disabled={isPending}
            >
              {isPending ? "Guardando…" : isEdit ? "Guardar plan" : "Crear plan"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
