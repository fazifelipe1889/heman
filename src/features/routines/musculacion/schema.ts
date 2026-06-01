import { z } from "zod"

import { EXPERIENCE_LEVELS, GOALS } from "@/lib/domain/enums"

const exerciseSchema = z.object({
  exerciseName: z.string().min(1, "Elegí un ejercicio"),
  exerciseRef: z.string().optional(),
  sets: z.number("Series").int().min(1, "Mín. 1").max(20, "Máx. 20"),
  targetReps: z.string().max(20).optional(),
  targetWeight: z.number().min(0).max(1000).optional(),
  targetRir: z.number().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  notes: z.string().max(300).optional(),
})

export const musculacionSchema = z.object({
  name: z.string().min(2, "Ingresá un nombre").max(80, "Demasiado largo"),
  description: z.string().max(300).optional(),
  goal: z.enum(GOALS).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  exercises: z.array(exerciseSchema).min(1, "Agregá al menos un ejercicio"),
})

export type MusculacionFormValues = z.infer<typeof musculacionSchema>
