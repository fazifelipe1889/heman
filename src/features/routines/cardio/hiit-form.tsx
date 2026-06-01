"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Flame } from "lucide-react"

import { HIIT_EXERCISES, INTENSITIES } from "@/lib/domain/training"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/routines/fields"
import { createHiitAction } from "@/features/routines/actions"
import { hiitSchema, type HiitFormValues } from "./schema"

type BigField = "workSeconds" | "restSeconds" | "rounds"

function BigNumber({ name, label }: { name: BigField; label: string }) {
  const { control } = useFormContext<HiitFormValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              className="h-20 w-full rounded-2xl text-center !text-4xl font-bold tabular-nums"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? undefined : e.target.valueAsNumber
                )
              }
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function HiitForm() {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<HiitFormValues>({
    resolver: zodResolver(hiitSchema),
    defaultValues: {
      name: "",
      description: "",
      mainExercise: undefined,
      rounds: undefined,
      workSeconds: undefined,
      restSeconds: undefined,
      intervals: undefined,
      intensity: undefined,
    },
  })

  function onSubmit(values: HiitFormValues) {
    startTransition(async () => {
      const res = await createHiitAction(values)
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
              <Flame className="size-6 text-destructive" /> Cardio HIIT
            </h1>
            <p className="text-sm text-muted-foreground">
              Intervalos de alta intensidad.
            </p>
          </div>

          {/* Bloque visual de tiempos */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <BigNumber name="workSeconds" label="Trabajo (s)" />
              <BigNumber name="restSeconds" label="Descanso (s)" />
              <BigNumber name="rounds" label="Rondas" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="name"
                label="Nombre"
                placeholder="Ej: Sprints 30/30"
              />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Opcional"
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  name="mainExercise"
                  label="Ejercicio principal"
                  options={HIIT_EXERCISES}
                />
                <SelectField
                  name="intensity"
                  label="Intensidad"
                  options={INTENSITIES}
                />
              </div>
              <NumberField
                name="intervals"
                label="Intervalos por ronda"
                min={1}
                max={50}
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
              {isPending ? "Guardando…" : "Guardar rutina"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
