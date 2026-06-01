import { z } from "zod"

export const lissSchema = z.object({
  name: z.string().min(2, "Ingresá un nombre").max(80, "Demasiado largo"),
  description: z.string().max(300).optional(),
  modality: z.string().optional(),
  durationMin: z.number().int().min(1).max(600).optional(),
  intensity: z.string().optional(),
  incline: z.number().min(0).max(30).optional(),
  speed: z.number().min(0).max(40).optional(),
  distanceKm: z.number().min(0).max(500).optional(),
  targetCalories: z.number().int().min(0).max(5000).optional(),
  weeklyFrequency: z.number().int().min(1).max(14).optional(),
})
export type LissFormValues = z.infer<typeof lissSchema>

export const hiitSchema = z.object({
  name: z.string().min(2, "Ingresá un nombre").max(80, "Demasiado largo"),
  description: z.string().max(300).optional(),
  mainExercise: z.string().optional(),
  rounds: z.number().int().min(1).max(50).optional(),
  workSeconds: z.number().int().min(1).max(3600).optional(),
  restSeconds: z.number().int().min(0).max(3600).optional(),
  intervals: z.number().int().min(1).max(50).optional(),
  intensity: z.string().optional(),
})
export type HiitFormValues = z.infer<typeof hiitSchema>

// ---------------------------------------------------------------------------
// Intervalos personalizados
// ---------------------------------------------------------------------------
const blockSchema = z.object({
  name: z.string().min(1, "Poné un nombre al bloque").max(50),
  durationSeconds: z
    .number("Duración requerida")
    .int()
    .min(1, "Mín. 1 segundo")
    .max(3600),
  intensity: z.string().optional(),
})

export const customIntervalSchema = z.object({
  name: z.string().min(2, "Ingresá un nombre").max(80, "Demasiado largo"),
  description: z.string().max(300).optional(),
  rounds: z.number().int().min(1).max(100).optional(),
  blocks: z
    .array(blockSchema)
    .min(1, "Agregá al menos un bloque"),
})
export type CustomIntervalFormValues = z.infer<typeof customIntervalSchema>
