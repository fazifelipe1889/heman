import { z } from "zod"

import {
  EXPERIENCE_LEVELS,
  GOALS,
  SEXES,
  TRAINING_TYPES,
  UNITS,
} from "@/lib/domain/enums"

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Ingresá tu nombre")
    .max(80, "Nombre demasiado largo"),
  birthDate: z
    .string()
    .min(1, "Ingresá tu fecha de nacimiento")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  sex: z.enum(SEXES, "Seleccioná una opción"),
  heightCm: z
    .number("Ingresá tu altura")
    .min(50, "Mínimo 50 cm")
    .max(260, "Máximo 260 cm"),
  weightKg: z
    .number("Ingresá tu peso")
    .min(20, "Mínimo 20 kg")
    .max(400, "Máximo 400 kg"),
  goal: z.enum(GOALS, "Seleccioná un objetivo"),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, "Seleccioná tu nivel"),
  trainingDaysPerWeek: z
    .number("Seleccioná la frecuencia")
    .int()
    .min(1, "Al menos 1 día")
    .max(7, "Máximo 7 días"),
  preferredTrainingType: z.enum(TRAINING_TYPES, "Seleccioná una opción"),
  units: z.enum(UNITS),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
