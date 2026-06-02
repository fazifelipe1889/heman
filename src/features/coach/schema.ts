import { z } from "zod"

import {
  COACHING_CATEGORIES,
  COACHING_LEVELS,
  PRODUCT_TYPES,
  CONTENT_BLOCK_TYPES,
  INTAKE_FIELD_TYPES,
  ROUTINE_MODES,
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
  location: z.string().max(120).optional(),
  publicEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  instagram: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
  tiktok: z.string().max(100).optional(),
  // FAQ a nivel coach (objetos para useFieldArray; las actions filtran vacíos).
  faq: z.array(
    z.object({
      question: z.string().max(200),
      answer: z.string().max(1000),
    })
  ),
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
  // Listas dinámicas (objetos para useFieldArray; las actions filtran vacíos).
  includes: z.array(z.object({ value: z.string().max(120) })),
  faq: z.array(
    z.object({
      question: z.string().max(200),
      answer: z.string().max(1000),
    })
  ),
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
  // Precio opcional en USD (doble moneda). undefined = no se muestra.
  priceUsd: z.number().min(0).max(1_000_000).optional(),
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
  isFeatured: z.boolean(),
})

export type PlanValues = z.infer<typeof planSchema>

// ---------------------------------------------------------------------------
// Producto (modelo plano): vitrina (program) + precio/duración + perks (plan)
// fusionados en un solo formulario "+ Crear".
// ---------------------------------------------------------------------------
export const productSchema = z.object({
  productType: z.enum(PRODUCT_TYPES),
  // --- Exposición del producto (vitrina) ---
  title: z.string().min(3, "Ingresá un título").max(200),
  slug: z
    .string()
    .min(1, "Ingresá un slug")
    .max(100)
    .regex(/^[a-z0-9_-]+$/i, "Solo letras, números, guiones y guion bajo"),
  // tagline = gancho
  tagline: z.string().max(300).optional(),
  // descripción corta (vitrina) vs descripción larga (ver detalle)
  shortDescription: z.string().max(400).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(COACHING_CATEGORIES),
  level: z.enum(COACHING_LEVELS).optional(),
  coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  introVideoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  // checklist de "qué incluye"
  includes: z.array(z.object({ value: z.string().max(120) })),
  faq: z.array(
    z.object({
      question: z.string().max(200),
      answer: z.string().max(1000),
    })
  ),
  // --- Precio y duración (plan comprable) ---
  price: z.number("Ingresá un precio").min(0, "No puede ser negativo").max(100_000_000),
  priceUsd: z.number().min(0).max(1_000_000).optional(),
  durationDays: z
    .number("Ingresá la duración")
    .int()
    .min(1, "Mínimo 1 día")
    .max(365 * 5, "Máximo 5 años"),
  // --- Perks (requeridos: el formulario provee defaults) ---
  chatEnabled: z.boolean(),
  videoCallsCount: z.number().int().min(0).max(100),
  videoCallMinutes: z.number().int().min(0).max(240),
  routineEnabled: z.boolean(),
  routineReconfigs: z.number().int().min(0).max(52),
  // --- Configuración de rutina (solo si routineEnabled) ---
  routineMode: z.enum(ROUTINE_MODES),
  /** Ejercicios exactos (modo personalizado). */
  routineExercises: z.array(
    z.object({
      exerciseName: z.string().max(200),
      exerciseRef: z.string().optional(),
      sets: z.number().int().min(1).max(20),
      targetReps: z.string().max(20).optional(),
      targetWeight: z.number().min(0).max(1000).optional(),
      targetRir: z.number().min(0).max(10).optional(),
      restSeconds: z.number().int().min(0).max(900).optional(),
      notes: z.string().max(300).optional(),
    })
  ),
  /** Grupos musculares y volumen (modo adaptativo). */
  routineGroups: z.array(
    z.object({
      muscleGroup: z.string().max(80),
      exerciseCount: z.number().int().min(1).max(10),
      sets: z.number().int().min(1).max(20),
      notes: z.string().max(200).optional(),
    })
  ),
  supplementsEnabled: z.boolean(),
  progressSharingEnabled: z.boolean(),
  // --- Contenido entregable ---
  content: z.array(
    z.object({
      type: z.enum(CONTENT_BLOCK_TYPES),
      title: z.string().max(120).optional(),
      body: z.string().max(5000).optional(),
      url: z.string().optional(),
    })
  ),
  nutritionNotes: z.string().max(5000).optional(),
  // --- Formulario para el cliente ---
  intakeForm: z.array(
    z.object({
      id: z.string(),
      label: z.string().max(200),
      type: z.enum(INTAKE_FIELD_TYPES),
      required: z.boolean(),
    })
  ),
})

export type ProductValues = z.infer<typeof productSchema>

// ---------------------------------------------------------------------------
// Transformación (prueba social: caso antes/después)
// ---------------------------------------------------------------------------
export const transformationSchema = z.object({
  clientName: z.string().min(1, "Ingresá el nombre del cliente").max(100),
  beforeUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  afterUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  metric: z.string().max(120).optional(),
  testimonial: z.string().max(600).optional(),
})

export type TransformationValues = z.infer<typeof transformationSchema>

// ---------------------------------------------------------------------------
// Notas privadas del coach sobre un cliente
// ---------------------------------------------------------------------------
export const coachNotesSchema = z.object({
  subscriptionId: z.string().uuid(),
  notes: z.string().max(5000),
})

export type CoachNotesValues = z.infer<typeof coachNotesSchema>
