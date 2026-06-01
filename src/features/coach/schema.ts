import { z } from "zod"

import {
  COACHING_CATEGORIES,
  COACHING_LEVELS,
} from "@/lib/domain/coaching"

/**
 * Schemas de formulario del panel de coach.
 * Valores camelCase orientados a la UI; las actions los traducen a la forma
 * de la BD (snake_case, price en centavos, etc.).
 */

// ---------------------------------------------------------------------------
// Alta / edición del perfil de coach
// ---------------------------------------------------------------------------
export const coachProfileSchema = z.object({
  handle: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(50, "Demasiado largo")
    .regex(/^[a-z0-9_-]+$/i, "Solo letras, números, guiones y guion bajo"),
  displayName: z.string().min(1, "Ingresá tu nombre público").max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
  tiktok: z.string().max(100).optional(),
})

export type CoachProfileValues = z.infer<typeof coachProfileSchema>

// ---------------------------------------------------------------------------
// Programa (asesoría)
// ---------------------------------------------------------------------------
export const programSchema = z.object({
  title: z.string().min(3, "Ingresá un título").max(200),
  slug: z
    .string()
    .min(1, "Ingresá un slug")
    .max(100)
    .regex(/^[a-z0-9_-]+$/i, "Solo letras, números, guiones y guion bajo"),
  tagline: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(COACHING_CATEGORIES),
  level: z.enum(COACHING_LEVELS).optional(),
  coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  introVideoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type ProgramValues = z.infer<typeof programSchema>

// ---------------------------------------------------------------------------
// Plan (producto comprable)
// ---------------------------------------------------------------------------
export const planSchema = z.object({
  name: z.string().min(1, "Ingresá un nombre").max(100),
  description: z.string().max(500).optional(),
  // En la UI el precio se ingresa en la moneda (pesos), no en centavos.
  price: z.number("Ingresá un precio").min(0, "No puede ser negativo").max(100_000_000),
  durationDays: z
    .number("Ingresá la duración")
    .int()
    .min(1, "Mínimo 1 día")
    .max(365 * 5, "Máximo 5 años"),
  // Perks (requeridos: el formulario siempre provee valores por defecto)
  chatEnabled: z.boolean(),
  videoCallsCount: z.number().int().min(0).max(100),
  videoCallMinutes: z.number().int().min(0).max(240),
  routineEnabled: z.boolean(),
  routineReconfigs: z.number().int().min(0).max(52),
  routineTemplateId: z.string().uuid().optional(),
  supplementsEnabled: z.boolean(),
  supplementTemplateId: z.string().uuid().optional(),
  progressSharingEnabled: z.boolean(),
  isVisible: z.boolean(),
})

export type PlanValues = z.infer<typeof planSchema>

// ---------------------------------------------------------------------------
// Notas privadas del coach sobre un cliente
// ---------------------------------------------------------------------------
export const coachNotesSchema = z.object({
  subscriptionId: z.string().uuid(),
  notes: z.string().max(5000),
})

export type CoachNotesValues = z.infer<typeof coachNotesSchema>
