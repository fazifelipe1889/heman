"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { CARDIO_MODALITIES, INTENSITIES } from "@/lib/domain/training"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/routines/fields"
import { createLissAction } from "@/features/routines/actions"
import { lissSchema, type LissFormValues } from "./schema"

export function LissForm() {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<LissFormValues>({
    resolver: zodResolver(lissSchema),
    defaultValues: {
      name: "",
      description: "",
      modality: undefined,
      durationMin: undefined,
      intensity: undefined,
      incline: undefined,
      speed: undefined,
      distanceKm: undefined,
      targetCalories: undefined,
      weeklyFrequency: undefined,
    },
  })

  function onSubmit(values: LissFormValues) {
    startTransition(async () => {
      const res = await createLissAction(values)
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
            <h1 className="text-2xl font-bold tracking-tight">Cardio LISS</h1>
            <p className="text-sm text-muted-foreground">
              Cardio constante de baja intensidad.
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="name"
                label="Nombre"
                placeholder="Ej: Caminata inclinada"
              />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Opcional"
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  name="modality"
                  label="Modalidad"
                  options={CARDIO_MODALITIES}
                />
                <SelectField
                  name="intensity"
                  label="Intensidad"
                  options={INTENSITIES}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  name="durationMin"
                  label="Duración (min)"
                  min={1}
                  max={600}
                />
                <NumberField
                  name="distanceKm"
                  label="Distancia (km)"
                  min={0}
                  step="0.1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  name="incline"
                  label="Inclinación (%)"
                  min={0}
                  max={30}
                  step="0.5"
                />
                <NumberField
                  name="speed"
                  label="Velocidad (km/h)"
                  min={0}
                  step="0.1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  name="targetCalories"
                  label="Calorías objetivo"
                  min={0}
                />
                <NumberField
                  name="weeklyFrequency"
                  label="Frec. semanal"
                  min={1}
                  max={14}
                />
              </div>
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
              {isPending ? "Guardando…" : "Guardar rutina"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
