"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import {
  TextField,
  NumberField,
  SelectField,
} from "@/features/routines/fields"
import { saveClientRoutineAction } from "./actions"
import type { MultiPersonalizedTemplatePayload } from "@/lib/domain/coaching"

const clientRoutineSchema = z.object({
  routines: z.array(
    z.object({
      name: z.string().max(100),
      exercises: z.array(
        z.object({
          exerciseName: z.string().min(1, "Nombre requerido").max(100),
          sets: z.number().int().min(1).max(30),
          targetReps: z.string().max(50).optional().or(z.literal("")),
          notes: z.string().max(300).optional().or(z.literal("")),
        })
      ),
    })
  ),
  planning: z.array(
    z.object({
      label: z.string().max(80),
      routineIndex: z.number().int().min(0),
    })
  ),
})

type ClientRoutineFormValues = z.infer<typeof clientRoutineSchema>

type Props = {
  subscriptionId: string
  existingTemplateId: string | null
  initialPayload: MultiPersonalizedTemplatePayload | null
}

export function ClientRoutineForm({
  subscriptionId,
  existingTemplateId,
  initialPayload,
}: Props) {
  const [isPending, startTransition] = React.useTransition()
  const [expandedRoutines, setExpandedRoutines] = React.useState<Set<number>>(
    new Set([0])
  )

  const form = useForm<ClientRoutineFormValues>({
    resolver: zodResolver(clientRoutineSchema),
    defaultValues: {
      routines:
        initialPayload?.routines.map((r) => ({
          name: r.name,
          exercises: r.exercises.map((e) => ({
            exerciseName: e.exerciseName,
            sets: e.sets,
            targetReps: e.targetReps ?? "",
            notes: e.notes ?? "",
          })),
        })) ?? [],
      planning: initialPayload?.planning ?? [],
    },
  })

  const routinesList = useFieldArray({ control: form.control, name: "routines" })
  const planningList = useFieldArray({ control: form.control, name: "planning" })
  const w = useWatch({ control: form.control })

  function toggleRoutineExpanded(idx: number) {
    setExpandedRoutines((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function onSubmit(values: ClientRoutineFormValues) {
    startTransition(async () => {
      const res = await saveClientRoutineAction(
        subscriptionId,
        existingTemplateId,
        values
      )
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Rutina guardada")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            <p className="text-xs text-muted-foreground">
              Diseñá la rutina específica para este cliente. Podés crear
              múltiples rutinas y asignarlas a días de entrenamiento.
            </p>

            {/* Lista de rutinas */}
            <div className="flex flex-col gap-3">
              {routinesList.fields.map((routineField, ri) => {
                const isExpanded = expandedRoutines.has(ri)
                return (
                  <div
                    key={routineField.id}
                    className="flex flex-col rounded-xl border bg-background/40"
                  >
                    <div className="flex items-center gap-2 p-3">
                      <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                      <input
                        className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                        placeholder={`Rutina ${ri + 1}`}
                        {...form.register(`routines.${ri}.name`)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleRoutineExpanded(ri)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => {
                          routinesList.remove(ri)
                          setExpandedRoutines((prev) => {
                            const next = new Set<number>()
                            prev.forEach((idx) => {
                              if (idx < ri) next.add(idx)
                              else if (idx > ri) next.add(idx - 1)
                            })
                            return next
                          })
                        }}
                        aria-label="Quitar rutina"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="flex flex-col gap-3 border-t px-3 pb-3 pt-3">
                        <ExercisesForRoutine routineIndex={ri} form={form} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                const newIdx = routinesList.fields.length
                routinesList.append({ name: "", exercises: [] })
                setExpandedRoutines((prev) => new Set([...prev, newIdx]))
              }}
            >
              <Plus className="size-4" /> Agregar rutina
            </Button>

            {/* Planificación */}
            {routinesList.fields.length > 0 && (
              <>
                <div className="flex flex-col gap-0.5 pt-2">
                  <p className="text-sm font-medium">Planificación</p>
                  <p className="text-xs text-muted-foreground">
                    Asignale una rutina a cada día de entrenamiento.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {planningList.fields.map((pField, pi) => {
                    const routineOptions = (w.routines ?? []).map((r, idx) => ({
                      value: String(idx),
                      label:
                        (r.name ?? "").trim() || `Rutina ${idx + 1}`,
                    }))
                    return (
                      <div
                        key={pField.id}
                        className="flex items-end gap-2 rounded-xl border bg-background/40 p-3"
                      >
                        <div className="flex-1">
                          <TextField
                            name={`planning.${pi}.label`}
                            label="Día / bloque"
                            placeholder="Ej: Lunes, Día 1…"
                          />
                        </div>
                        <div className="w-40 shrink-0">
                          <SelectField
                            name={`planning.${pi}.routineIndex`}
                            label="Rutina"
                            options={routineOptions}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mb-0.5 shrink-0 text-muted-foreground"
                          onClick={() => planningList.remove(pi)}
                          aria-label="Quitar día"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() =>
                      planningList.append({ label: "", routineIndex: 0 })
                    }
                  >
                    <Plus className="size-4" /> Agregar día
                  </Button>
                </div>
              </>
            )}

            <div className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={isPending}>
                <Save className="size-4" />
                {isPending ? "Guardando…" : "Guardar rutina"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

function ExercisesForRoutine({
  routineIndex,
  form,
}: {
  routineIndex: number
  form: ReturnType<typeof useForm<ClientRoutineFormValues>>
}) {
  const exercises = useFieldArray({
    control: form.control,
    name: `routines.${routineIndex}.exercises`,
  })

  return (
    <>
      {exercises.fields.map((ef, ei) => (
        <div
          key={ef.id}
          className="flex flex-col gap-3 rounded-xl border bg-background/60 p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <TextField
                name={`routines.${routineIndex}.exercises.${ei}.exerciseName`}
                label="Ejercicio"
                placeholder="Ej: Sentadilla, Press banca…"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0 text-muted-foreground"
              onClick={() => exercises.remove(ei)}
              aria-label="Quitar ejercicio"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              name={`routines.${routineIndex}.exercises.${ei}.sets`}
              label="Series"
              min={1}
              max={30}
            />
            <TextField
              name={`routines.${routineIndex}.exercises.${ei}.targetReps`}
              label="Reps / duración"
              placeholder="Ej: 8-12, 30s…"
            />
          </div>
          <TextField
            name={`routines.${routineIndex}.exercises.${ei}.notes`}
            label="Notas (opcional)"
            placeholder="Descanso, técnica, etc."
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          exercises.append({
            exerciseName: "",
            sets: 3,
            targetReps: "",
            notes: "",
          })
        }
      >
        <Plus className="size-4" /> Agregar ejercicio
      </Button>
    </>
  )
}
