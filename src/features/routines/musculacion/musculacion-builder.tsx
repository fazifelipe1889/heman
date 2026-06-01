"use client"

import * as React from "react"
import Link from "next/link"
import { useFieldArray, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

import { ExercisePicker } from "@/features/exercises/exercise-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/routines/fields"
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
} from "@/features/routines/options"
import { createMusculacionAction } from "@/features/routines/actions"
import { musculacionSchema, type MusculacionFormValues } from "./schema"

function newExercise() {
  return {
    exerciseName: "",
    exerciseRef: "",
    sets: 3,
    targetReps: "",
    targetWeight: undefined,
    targetRir: undefined,
    restSeconds: undefined,
    notes: "",
  }
}

// ---------------------------------------------------------------------------
// Fila de ejercicio
// ---------------------------------------------------------------------------
function ExerciseRow({
  index,
  onRemove,
  canRemove,
}: {
  index: number
  onRemove: () => void
  canRemove: boolean
}) {
  const { control, setValue, watch } = useFormContext<MusculacionFormValues>()
  const base = `exercises.${index}` as const
  const exerciseName = watch(`${base}.exerciseName`)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <FormField
            control={control}
            name={`${base}.exerciseName`}
            render={() => (
              <FormItem>
                <ExercisePicker
                  value={exerciseName}
                  onPick={(ex) => {
                    setValue(`${base}.exerciseName`, ex.name, {
                      shouldValidate: true,
                    })
                    setValue(`${base}.exerciseRef`, ex.id)
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 text-muted-foreground"
            onClick={onRemove}
            aria-label="Quitar ejercicio"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField name={`${base}.sets`} label="Series" min={1} max={20} />
        <TextField name={`${base}.targetReps`} label="Reps" placeholder="8-12" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <NumberField
          name={`${base}.targetWeight`}
          label="Peso (kg)"
          min={0}
          step="0.5"
        />
        <NumberField name={`${base}.targetRir`} label="RIR" min={0} max={10} />
        <NumberField
          name={`${base}.restSeconds`}
          label="Desc. (s)"
          min={0}
          max={900}
        />
      </div>
      <TextField name={`${base}.notes`} label="Notas" placeholder="Opcional" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Builder principal
// ---------------------------------------------------------------------------
export function MusculacionBuilder() {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<MusculacionFormValues>({
    resolver: zodResolver(musculacionSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: undefined,
      experienceLevel: undefined,
      exercises: [newExercise()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises",
  })

  function onSubmit(values: MusculacionFormValues) {
    startTransition(async () => {
      const res = await createMusculacionAction(values)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 pb-28">
          <div className="flex flex-col gap-3">
            <Link
              href="/routines"
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Rutinas
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              Crear rutina de musculación
            </h1>
          </div>

          {/* Metadata */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="name"
                label="Nombre de la rutina"
                placeholder="Ej: Push Day, Espalda y Bíceps…"
              />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Opcional"
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField name="goal" label="Objetivo" options={GOAL_OPTIONS} />
                <SelectField
                  name="experienceLevel"
                  label="Nivel"
                  options={EXPERIENCE_OPTIONS}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ejercicios */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Ejercicios</h2>
            {fields.map((f, i) => (
              <ExerciseRow
                key={f.id}
                index={i}
                canRemove={fields.length > 1}
                onRemove={() => remove(i)}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12"
            onClick={() => append(newExercise())}
          >
            <Plus className="size-4" /> Agregar ejercicio
          </Button>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4 py-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-base"
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "Guardar rutina"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
