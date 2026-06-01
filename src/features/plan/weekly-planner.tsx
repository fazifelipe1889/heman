"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2, X } from "lucide-react"

import { WEEKDAYS, todayWeekdayIndex } from "@/lib/domain/training"
import type { PlanDayWithRoutine } from "@/lib/db/plans"
import type { Routine } from "@/lib/supabase/types"
import { ROUTINE_TYPE_META } from "@/features/routines/routine-type"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addPlanDayRoutineAction,
  clearPlanDayAction,
  removePlanDayAction,
} from "./actions"

function DayCard({
  day,
  label,
  isToday,
  assigned,
  routines,
}: {
  day: number
  label: string
  isToday: boolean
  assigned: PlanDayWithRoutine[]
  routines: Routine[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const assignedIds = new Set(assigned.map((a) => a.routine_id))
  const available = routines.filter((r) => !assignedIds.has(r.id))
  const items = available.map((r) => ({ value: r.id, label: r.name }))
  // El selector "Agregar" siempre vuelve a vacío; sólo dispara la acción.
  const addValue: string | null = null

  return (
    <Card
      className={`flex flex-col gap-2 p-3 ${
        isToday ? "border-primary/60 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold">{label}</span>
          {isToday && (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              HOY
            </span>
          )}
        </div>
        {assigned.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Limpiar día"
            disabled={isPending}
            title="Limpiar día"
            onClick={() =>
              startTransition(async () => {
                await clearPlanDayAction(day)
                router.refresh()
              })
            }
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {assigned.length === 0 && (
          <span className="text-sm text-muted-foreground">Descanso</span>
        )}
        {assigned.map((a) => {
          const Icon = a.routine ? ROUTINE_TYPE_META[a.routine.type].icon : null
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg bg-muted/50 py-1.5 pr-1 pl-2.5"
            >
              {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
              <span className="flex-1 truncate text-sm font-medium">
                {a.routine?.name ?? "—"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Quitar rutina"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await removePlanDayAction(a.id)
                    router.refresh()
                  })
                }
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )
        })}
      </div>

      {items.length > 0 && (
        <Select
          items={items}
          value={addValue}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              await addPlanDayRoutineAction(day, v)
              router.refresh()
            })
          }}
        >
          <SelectTrigger className="h-9 w-full text-muted-foreground">
            <SelectValue placeholder="+ Agregar rutina" />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Card>
  )
}

export function WeeklyPlanner({
  routines,
  days,
}: {
  routines: Routine[]
  days: PlanDayWithRoutine[]
}) {
  const today = todayWeekdayIndex()

  return (
    <div className="flex flex-col gap-2">
      {WEEKDAYS.map((d) => (
        <DayCard
          key={d.value}
          day={d.value}
          label={d.label}
          isToday={d.value === today}
          assigned={days.filter((x) => x.day_of_week === d.value)}
          routines={routines}
        />
      ))}
    </div>
  )
}
