"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dumbbell, CheckCircle2 } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExercisePicker } from "@/features/exercises/exercise-picker"
import type { AdaptiveTemplateGroup } from "@/lib/domain/coaching"
import type { RoutineExerciseRow } from "@/lib/db/coaching"
import { saveAdaptiveExercisesAction } from "./actions"

type Selection = { exerciseName: string; exerciseRef: string }

/**
 * El cliente elige sus ejercicios para cada grupo muscular de una rutina
 * adaptativa. El volumen (series, cantidad) lo definió el coach.
 */
export function AdaptiveRoutinePicker({
  routineId,
  groups,
  initialExercises,
}: {
  routineId: string
  groups: AdaptiveTemplateGroup[]
  initialExercises: RoutineExerciseRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  // Prefill: los ejercicios guardados están en orden de grupo (position).
  const [selections, setSelections] = React.useState<Selection[][]>(() => {
    let cursor = 0
    return groups.map((g) => {
      const slots: Selection[] = []
      for (let s = 0; s < g.exerciseCount; s++) {
        const ex = initialExercises[cursor]
        slots.push(
          ex
            ? { exerciseName: ex.exercise_name, exerciseRef: ex.exercise_ref ?? "" }
            : { exerciseName: "", exerciseRef: "" }
        )
        cursor++
      }
      return slots
    })
  })

  function setSlot(groupIdx: number, slotIdx: number, value: Selection) {
    setSelections((prev) => {
      const next = prev.map((g) => g.slice())
      next[groupIdx][slotIdx] = value
      return next
    })
  }

  const totalSlots = groups.reduce((acc, g) => acc + g.exerciseCount, 0)
  const filledSlots = selections
    .flat()
    .filter((s) => s.exerciseName.trim()).length
  const allFilled = filledSlots === totalSlots

  function handleSave() {
    const exercises = selections.flatMap((slots, gi) =>
      slots
        .filter((s) => s.exerciseName.trim())
        .map((s) => ({
          exerciseName: s.exerciseName,
          exerciseRef: s.exerciseRef || null,
          sets: groups[gi].sets,
          notes: groups[gi].notes ?? null,
        }))
    )
    startTransition(async () => {
      const res = await saveAdaptiveExercisesAction({ routineId, exercises })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("¡Rutina guardada!")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, gi) => (
        <Card key={gi} size="sm">
          <CardContent className="flex flex-col gap-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Dumbbell className="size-4 text-primary" />
                {group.muscleGroup}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.exerciseCount} ej. · {group.sets} series
              </span>
            </div>
            {group.notes && (
              <p className="text-xs text-muted-foreground">{group.notes}</p>
            )}
            <div className="flex flex-col gap-2">
              {selections[gi]?.map((sel, si) => (
                <ExercisePicker
                  key={si}
                  value={sel.exerciseName}
                  onPick={(ex) =>
                    setSlot(gi, si, { exerciseName: ex.name, exerciseRef: ex.id })
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {filledSlots}/{totalSlots} ejercicios elegidos
        </span>
        <Button disabled={isPending || !allFilled} onClick={handleSave}>
          {isPending ? "Guardando…" : "Guardar mi rutina"}
        </Button>
      </div>

      {filledSlots > 0 && (
        <Link
          href={`/routines/${routineId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <CheckCircle2 className="size-4" /> Ver mi rutina
        </Link>
      )}
    </div>
  )
}
