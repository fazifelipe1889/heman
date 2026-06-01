"use client"

import * as React from "react"
import Link from "next/link"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Plus, Repeat2, Trash2 } from "lucide-react"

import { INTENSITIES } from "@/lib/domain/training"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/routines/fields"
import { createCustomIntervalAction } from "@/features/routines/actions"
import { customIntervalSchema, type CustomIntervalFormValues } from "./schema"

const INTENSITY_OPTIONS = [...INTENSITIES]

function newBlock(n: number) {
  return {
    name: n % 2 === 0 ? "Descanso" : "Trabajo",
    durationSeconds: n % 2 === 0 ? 60 : 30,
    intensity: undefined as string | undefined,
  }
}

export function CustomIntervalForm() {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<CustomIntervalFormValues>({
    resolver: zodResolver(customIntervalSchema),
    defaultValues: {
      name: "",
      description: "",
      rounds: 1,
      blocks: [
        { name: "Trabajo", durationSeconds: 30, intensity: undefined },
        { name: "Descanso", durationSeconds: 60, intensity: undefined },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "blocks",
  })

  // Duración total calculada en vivo (useWatch es compatible con React Compiler)
  const blocks = useWatch({ control: form.control, name: "blocks" })
  const rounds = useWatch({ control: form.control, name: "rounds" }) ?? 1
  const totalSeconds =
    blocks.reduce((a, b) => a + (b.durationSeconds || 0), 0) * rounds
  const totalMin = Math.floor(totalSeconds / 60)
  const totalSec = totalSeconds % 60

  function onSubmit(values: CustomIntervalFormValues) {
    startTransition(async () => {
      const res = await createCustomIntervalAction(values)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 pb-28">
          <div className="flex flex-col gap-3">
            <Link
              href="/routines/new/cardio"
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Cardio
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Repeat2 className="size-6 text-primary" /> Intervalos personalizados
            </h1>
            <p className="text-sm text-muted-foreground">
              Armá una secuencia de bloques que se repite N rondas.
            </p>
          </div>

          {/* Info general */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="name"
                label="Nombre"
                placeholder="Ej: Cardio en bici, Intervalos de calor…"
              />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Opcional"
              />
              <NumberField
                name="rounds"
                label="Rondas (repeticiones de la secuencia)"
                min={1}
                max={100}
              />
            </CardContent>
          </Card>

          {/* Bloques */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Secuencia de bloques</h2>
              {totalSeconds > 0 && (
                <span className="text-sm text-muted-foreground">
                  Total: {totalMin}:{String(totalSec).padStart(2, "0")}
                </span>
              )}
            </div>

            {fields.map((f, i) => (
              <div
                key={f.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <TextField
                      name={`blocks.${i}.name`}
                      label="Nombre del bloque"
                      placeholder="Trabajo, Descanso, Calentamiento…"
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-1 shrink-0 text-muted-foreground"
                      onClick={() => remove(i)}
                      aria-label="Quitar bloque"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    name={`blocks.${i}.durationSeconds`}
                    label="Duración (seg)"
                    min={1}
                    max={3600}
                  />
                  <SelectField
                    name={`blocks.${i}.intensity`}
                    label="Intensidad"
                    options={INTENSITY_OPTIONS}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => append(newBlock(fields.length))}
            >
              <Plus className="size-4" /> Agregar bloque
            </Button>
          </div>
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
