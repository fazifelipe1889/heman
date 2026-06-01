"use client"

import * as React from "react"
import { useForm, useFormContext, type FieldPath } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { completeOnboardingAction } from "./actions"
import { onboardingSchema, type OnboardingValues } from "./schemas"

const SEX_OPTIONS = SEXES.map((v) => ({ value: v, label: SEX_LABELS[v] }))
const GOAL_OPTIONS = GOALS.map((v) => ({ value: v, label: GOAL_LABELS[v] }))
const EXPERIENCE_OPTIONS = EXPERIENCE_LEVELS.map((v) => ({
  value: v,
  label: EXPERIENCE_LABELS[v],
}))
const TRAINING_TYPE_OPTIONS = TRAINING_TYPES.map((v) => ({
  value: v,
  label: TRAINING_TYPE_LABELS[v],
}))
const UNITS_OPTIONS = UNITS.map((v) => ({ value: v, label: UNITS_LABELS[v] }))
const DAY_ITEMS = Array.from({ length: 7 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} ${i + 1 === 1 ? "día" : "días"}`,
}))

type EnumFieldName =
  | "sex"
  | "goal"
  | "experienceLevel"
  | "preferredTrainingType"
  | "units"

/** Select reutilizable para campos de enum (valores string). */
function EnumSelectField({
  name,
  label,
  placeholder,
  options,
}: {
  name: EnumFieldName
  label: string
  placeholder: string
  options: readonly { value: string; label: string }[]
}) {
  const { control } = useFormContext<OnboardingValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            items={options}
            value={field.value ?? null}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

const STEPS = [
  { title: "Tus datos", description: "Contanos quién sos." },
  { title: "Medidas", description: "Para calcular volumen y progreso." },
  { title: "Tus objetivos", description: "Para personalizar tu entrenamiento." },
] as const

const STEP_FIELDS: FieldPath<OnboardingValues>[][] = [
  ["fullName", "birthDate", "sex"],
  ["units", "heightCm", "weightKg"],
  ["goal", "experienceLevel", "trainingDaysPerWeek", "preferredTrainingType"],
]

export function OnboardingWizard({
  initialFullName,
}: {
  initialFullName: string
}) {
  const [step, setStep] = React.useState(0)
  const [isPending, startTransition] = React.useTransition()
  const isLastStep = step === STEPS.length - 1
  const today = new Date().toISOString().slice(0, 10)

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: initialFullName,
      birthDate: "",
      sex: undefined,
      heightCm: undefined,
      weightKg: undefined,
      goal: undefined,
      experienceLevel: undefined,
      trainingDaysPerWeek: undefined,
      preferredTrainingType: "musculacion",
      units: "metric",
    },
  })

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function onSubmit(values: OnboardingValues) {
    startTransition(async () => {
      const res = await completeOnboardingAction(values)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Paso {step + 1} de {STEPS.length}
        </p>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step].title}</CardTitle>
              <CardDescription>{STEPS[step].description}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* Paso 1: datos personales */}
              <div className={step === 0 ? "flex flex-col gap-4" : "hidden"}>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          className="h-11"
                          {...field}
                        />
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
                        <Input
                          type="date"
                          max={today}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <EnumSelectField
                  name="sex"
                  label="Sexo"
                  placeholder="Seleccioná"
                  options={SEX_OPTIONS}
                />
              </div>

              {/* Paso 2: medidas */}
              <div className={step === 1 ? "flex flex-col gap-4" : "hidden"}>
                <EnumSelectField
                  name="units"
                  label="Unidades"
                  placeholder="Seleccioná"
                  options={UNITS_OPTIONS}
                />
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={50}
                          max={260}
                          step="0.5"
                          placeholder="175"
                          className="h-11"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber
                            )
                          }
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
                          type="number"
                          inputMode="decimal"
                          min={20}
                          max={400}
                          step="0.1"
                          placeholder="75"
                          className="h-11"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Paso 3: objetivos */}
              <div className={step === 2 ? "flex flex-col gap-4" : "hidden"}>
                <EnumSelectField
                  name="goal"
                  label="Objetivo principal"
                  placeholder="Seleccioná"
                  options={GOAL_OPTIONS}
                />
                <EnumSelectField
                  name="experienceLevel"
                  label="Nivel de experiencia"
                  placeholder="Seleccioná"
                  options={EXPERIENCE_OPTIONS}
                />
                <FormField
                  control={form.control}
                  name="trainingDaysPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días por semana</FormLabel>
                      <Select
                        items={DAY_ITEMS}
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Seleccioná" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAY_ITEMS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <EnumSelectField
                  name="preferredTrainingType"
                  label="Tipo de entrenamiento preferido"
                  placeholder="Seleccioná"
                  options={TRAINING_TYPE_OPTIONS}
                />
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12"
                  onClick={() => setStep((s) => Math.max(s - 1, 0))}
                  disabled={isPending}
                >
                  <ChevronLeft className="size-4" />
                  Atrás
                </Button>
              )}
              {isLastStep ? (
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 flex-1 text-base"
                  disabled={isPending}
                >
                  {isPending ? "Guardando…" : "Finalizar"}
                  <Check className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="h-12 flex-1 text-base"
                  onClick={handleNext}
                >
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
