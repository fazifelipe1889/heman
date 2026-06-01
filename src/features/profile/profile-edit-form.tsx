"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  EXPERIENCE_LEVELS,
  GOALS,
  SEXES,
  TRAINING_TYPES,
  UNITS,
} from "@/lib/domain/enums"
import {
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  TRAINING_TYPE_LABELS,
  UNITS_LABELS,
} from "@/lib/domain/labels"
import type { Profile } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateProfileAction } from "./actions"
import { onboardingSchema, type OnboardingValues } from "./schemas"

const SEX_OPTIONS      = SEXES.map((v) => ({ value: v, label: SEX_LABELS[v] }))
const GOAL_OPTIONS     = GOALS.map((v) => ({ value: v, label: GOAL_LABELS[v] }))
const EXPERIENCE_OPTIONS = EXPERIENCE_LEVELS.map((v) => ({ value: v, label: EXPERIENCE_LABELS[v] }))
const TRAINING_OPTIONS = TRAINING_TYPES.map((v) => ({ value: v, label: TRAINING_TYPE_LABELS[v] }))
const UNITS_OPTIONS    = UNITS.map((v) => ({ value: v, label: UNITS_LABELS[v] }))
const DAY_ITEMS        = Array.from({ length: 7 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} ${i + 1 === 1 ? "día" : "días"}`,
}))

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      fullName:             profile.full_name ?? "",
      birthDate:            profile.birth_date ?? "",
      sex:                  profile.sex ?? undefined,
      heightCm:             profile.height_cm ?? undefined,
      weightKg:             profile.weight_kg ?? undefined,
      goal:                 profile.goal ?? undefined,
      experienceLevel:      profile.experience_level ?? undefined,
      trainingDaysPerWeek:  profile.training_days_per_week ?? undefined,
      preferredTrainingType: profile.preferred_training_type ?? "musculacion",
      units:                profile.units ?? "metric",
    },
  })

  function onSubmit(values: OnboardingValues) {
    startTransition(async () => {
      const res = await updateProfileAction(values)
      if (res?.error) toast.error(res.error)
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">

        {/* ── Datos personales ── */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos personales
          </p>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input type="text" autoComplete="name" placeholder="Tu nombre" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" max={today} className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select items={SEX_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEX_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Medidas ── */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Medidas
          </p>
          <FormField
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades</FormLabel>
                <Select items={UNITS_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNITS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heightCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number" inputMode="decimal" min={50} max={260} step="0.5" placeholder="175" className="h-11"
                    name={field.name} ref={field.ref} onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number" inputMode="decimal" min={20} max={400} step="0.1" placeholder="75" className="h-11"
                    name={field.name} ref={field.ref} onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Objetivos ── */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Objetivos
          </p>
          <FormField
            control={form.control}
            name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo principal</FormLabel>
                <Select items={GOAL_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GOAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel de experiencia</FormLabel>
                <Select items={EXPERIENCE_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="trainingDaysPerWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Días por semana</FormLabel>
                <Select
                  items={DAY_ITEMS}
                  value={field.value != null ? String(field.value) : null}
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DAY_ITEMS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preferredTrainingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de entrenamiento preferido</FormLabel>
                <Select items={TRAINING_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRAINING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Button type="submit" disabled={isPending} className="h-12 w-full text-base font-semibold">
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </form>
    </Form>
  )
}
