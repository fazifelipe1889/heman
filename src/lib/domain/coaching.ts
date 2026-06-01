/**
 * Dominio puro del sistema de asesorías (coaching marketplace).
 * Framework-agnóstico. Sin dependencias de React/Next.
 *
 * Define:
 * - Enums (roles, estados, categorías, etc.)
 * - Esquemas Zod para validación
 * - Constantes de negocio
 */

import { z } from "zod"

// =============================================================================
// ENUMS: coaches y coaching
// =============================================================================

export const PROFILE_ROLES = ["user", "coach", "admin"] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]

export const COACH_STATUSES = [
  "pending_review",
  "active",
  "suspended",
  "rejected",
] as const
export type CoachStatus = (typeof COACH_STATUSES)[number]

export const COACHING_PROGRAM_STATUSES = [
  "draft",
  "published",
  "archived",
] as const
export type CoachingProgramStatus = (typeof COACHING_PROGRAM_STATUSES)[number]

export const COACHING_CATEGORIES = [
  "musculacion",
  "recomposicion",
  "fuerza",
  "perdida_grasa",
  "cardio",
  "mixto",
] as const
export type CoachingCategory = (typeof COACHING_CATEGORIES)[number]

export const COACHING_LEVELS = [
  "Principiante",
  "Intermedio",
  "Avanzado",
] as const
export type CoachingLevel = (typeof COACHING_LEVELS)[number]

export const BILLING_TYPES = ["one_time", "recurring"] as const
export type BillingType = (typeof BILLING_TYPES)[number]

export const RECURRING_INTERVALS = ["month", "quarter", "year"] as const
export type RecurringInterval = (typeof RECURRING_INTERVALS)[number]

export const SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "paused",
  "expired",
  "cancelled",
  "refunded",
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const MESSAGE_SENDER_ROLES = ["coach", "user"] as const
export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number]

export const ATTACHMENT_TYPES = ["image", "video", "file"] as const
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number]

export const PAYMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "refunded",
  "charged_back",
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_PROVIDERS = ["mercadopago", "stripe"] as const
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number]

// =============================================================================
// CONSTANTES DE NEGOCIO
// =============================================================================

/** Comisión estándar del coach (%). */
export const DEFAULT_COACH_COMMISSION_PCT = 15

/** Moneda por defecto. */
export const DEFAULT_CURRENCY = "ARS"

/** Número máximo de reconfigs de rutina incluidas en base. */
export const DEFAULT_RECONFIGS_INCLUDED = 2

/** Número máximo de video calls incluidas en base. */
export const DEFAULT_VIDEO_CALLS_INCLUDED = 2

/** Duración máxima de video call (minutos). */
export const DEFAULT_VIDEO_CALL_MINUTES = 30

/** Máximo de suscripciones activas por usuario a la vez (por plan). */
export const MAX_ACTIVE_SUBSCRIPTIONS_PER_USER = 1

// =============================================================================
// ESQUEMAS ZOD: Perks (JSONB en BD)
// =============================================================================

export const ChatPerkSchema = z.object({
  enabled: z.boolean().default(false),
})
export type ChatPerk = z.infer<typeof ChatPerkSchema>

export const VideoCallsPerkSchema = z.object({
  enabled: z.boolean().default(false),
  count: z.number().int().min(0).default(0),
  minutes: z.number().int().min(0).default(0),
})
export type VideoCallsPerk = z.infer<typeof VideoCallsPerkSchema>

export const RoutinePerkSchema = z.object({
  enabled: z.boolean().default(false),
  reconfigs_included: z.number().int().min(0).default(DEFAULT_RECONFIGS_INCLUDED),
})
export type RoutinePerk = z.infer<typeof RoutinePerkSchema>

export const SupplementsPerkSchema = z.object({
  enabled: z.boolean().default(false),
})
export type SupplementsPerk = z.infer<typeof SupplementsPerkSchema>

export const ProgressSharingPerkSchema = z.object({
  enabled: z.boolean().default(false),
})
export type ProgressSharingPerk = z.infer<typeof ProgressSharingPerkSchema>

export const PerkContainerSchema = z.object({
  chat: ChatPerkSchema.default({ enabled: false }),
  video_calls: VideoCallsPerkSchema.default({ enabled: false, count: 0, minutes: 0 }),
  routine: RoutinePerkSchema.default({
    enabled: false,
    reconfigs_included: DEFAULT_RECONFIGS_INCLUDED,
  }),
  supplements: SupplementsPerkSchema.default({ enabled: false }),
  progress_sharing: ProgressSharingPerkSchema.default({ enabled: false }),
})
export type PerkContainer = z.infer<typeof PerkContainerSchema>

/**
 * Default perks para nuevos planes.
 * Todos deshabilitados por defecto; el coach habilita lo que quiere.
 */
export const DEFAULT_PERKS: PerkContainer = {
  chat: { enabled: false },
  video_calls: { enabled: false, count: 0, minutes: 0 },
  routine: { enabled: false, reconfigs_included: DEFAULT_RECONFIGS_INCLUDED },
  supplements: { enabled: false },
  progress_sharing: { enabled: false },
}

// =============================================================================
// ESQUEMAS ZOD: Entidades principales
// =============================================================================

/**
 * Coach Profile: identidad pública del coach
 */
export const CoachProfileInsertSchema = z.object({
  handle: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/i),
  display_name: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
  socials: z.record(z.string(), z.string()).default({}),
  payout_provider: z.string().optional(),
  payout_ref: z.record(z.string(), z.unknown()).default({}),
})

export const CoachProfileSchema = CoachProfileInsertSchema.extend({
  id: z.string().uuid(),
  is_verified: z.boolean().default(false),
  status: z.enum(COACH_STATUSES).default("pending_review"),
  commission_pct: z.number().min(0).max(100).default(DEFAULT_COACH_COMMISSION_PCT),
  rating_avg: z.number().min(0).max(5).default(0),
  rating_count: z.number().int().min(0).default(0),
  active_clients: z.number().int().min(0).default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachProfileInsert = z.infer<typeof CoachProfileInsertSchema>
export type CoachProfile = z.infer<typeof CoachProfileSchema>

/**
 * Coaching Program: la asesoría/landing del coach
 */
export const CoachingProgramInsertSchema = z.object({
  coach_id: z.string().uuid(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  title: z.string().min(1).max(200),
  tagline: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(COACHING_CATEGORIES),
  cover_url: z.string().url().optional(),
  intro_video_url: z.string().url().optional(),
  level: z.enum(COACHING_LEVELS).optional(),
  includes: z.record(z.string(), z.unknown()).default({}),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
})

export const CoachingProgramSchema = CoachingProgramInsertSchema.extend({
  id: z.string().uuid(),
  status: z.enum(COACHING_PROGRAM_STATUSES).default("draft"),
  position: z.number().int().default(0),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachingProgramInsert = z.infer<typeof CoachingProgramInsertSchema>
export type CoachingProgram = z.infer<typeof CoachingProgramSchema>

/**
 * Routine Template: plantilla de rutina que se snapshota al comprar
 */
export const CoachRoutineTemplateInsertSchema = z.object({
  coach_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  payload: z.record(z.string(), z.unknown()),
})

export const CoachRoutineTemplateSchema = CoachRoutineTemplateInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachRoutineTemplateInsert = z.infer<typeof CoachRoutineTemplateInsertSchema>
export type CoachRoutineTemplate = z.infer<typeof CoachRoutineTemplateSchema>

/**
 * Supplement Template: plantilla de suplementación
 */
export const CoachSupplementTemplateInsertSchema = z.object({
  coach_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  items: z.array(z.object({
    name: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    notes: z.string().optional(),
  })),
})

export const CoachSupplementTemplateSchema = CoachSupplementTemplateInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachSupplementTemplateInsert = z.infer<typeof CoachSupplementTemplateInsertSchema>
export type CoachSupplementTemplate = z.infer<typeof CoachSupplementTemplateSchema>

/**
 * Coaching Plan: el producto comprable (tier: Base, Premium, VIP, etc)
 */
export const CoachingPlanInsertSchema = z.object({
  program_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price_cents: z.number().int().min(0),
  currency: z.string().default(DEFAULT_CURRENCY),
  billing_type: z.enum(BILLING_TYPES).default("one_time"),
  recurring_interval: z.enum(RECURRING_INTERVALS).optional(),
  duration_days: z.number().int().min(1).max(365 * 5), // max 5 años
  perks: PerkContainerSchema.default(DEFAULT_PERKS),
  routine_template_id: z.string().uuid().optional(),
  supplement_template_id: z.string().uuid().optional(),
  is_visible: z.boolean().default(true),
  position: z.number().int().default(0),
})

export const CoachingPlanSchema = CoachingPlanInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachingPlanInsert = z.infer<typeof CoachingPlanInsertSchema>
export type CoachingPlan = z.infer<typeof CoachingPlanSchema>

/**
 * Coaching Subscription: vínculo entre usuario y plan comprado
 */
export const CoachingSubscriptionInsertSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  program_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  perks_snapshot: PerkContainerSchema,
  routine_id: z.string().uuid().optional(),
})

export const CoachingSubscriptionSchema = CoachingSubscriptionInsertSchema.extend({
  id: z.string().uuid(),
  status: z.enum(SUBSCRIPTION_STATUSES).default("pending"),
  starts_at: z.coerce.date().nullable(),
  ends_at: z.coerce.date().nullable(),
  messages_used: z.number().int().default(0),
  video_calls_used: z.number().int().default(0),
  reconfigs_used: z.number().int().default(0),
  coach_notes: z.string().max(5000).optional(),
  last_payment_id: z.string().uuid().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CoachingSubscriptionInsert = z.infer<typeof CoachingSubscriptionInsertSchema>
export type CoachingSubscription = z.infer<typeof CoachingSubscriptionSchema>

/**
 * Coaching Thread: canal de comunicación coach <> usuario
 */
export const CoachingThreadSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  user_id: z.string().uuid(),
  last_message_at: z.coerce.date().nullable(),
  coach_unread: z.number().int().default(0),
  user_unread: z.number().int().default(0),
  created_at: z.coerce.date(),
})

export type CoachingThread = z.infer<typeof CoachingThreadSchema>

/**
 * Coaching Message: mensaje individual en un thread
 */
export const CoachingMessageInsertSchema = z.object({
  subscription_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  sender_role: z.enum(MESSAGE_SENDER_ROLES),
  body: z.string().optional(),
  attachment_url: z.string().url().optional(),
  attachment_type: z.enum(ATTACHMENT_TYPES).optional(),
})

export const CoachingMessageSchema = CoachingMessageInsertSchema.extend({
  id: z.string().uuid(),
  read_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
})

export type CoachingMessageInsert = z.infer<typeof CoachingMessageInsertSchema>
export type CoachingMessage = z.infer<typeof CoachingMessageSchema>

/**
 * Coaching Payment: historial de transacciones
 */
export const CoachingPaymentSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  program_id: z.string().uuid(),
  provider: z.enum(PAYMENT_PROVIDERS),
  provider_ref: z.string(),
  amount_cents: z.number().int().min(0),
  currency: z.string(),
  commission_cents: z.number().int().min(0),
  net_cents: z.number().int().min(0),
  status: z.enum(PAYMENT_STATUSES).default("pending"),
  raw_event: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.coerce.date(),
})

export type CoachingPayment = z.infer<typeof CoachingPaymentSchema>

/**
 * Coaching Review: reseña/calificación del cliente
 */
export const CoachingReviewInsertSchema = z.object({
  subscription_id: z.string().uuid(),
  program_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export const CoachingReviewSchema = CoachingReviewInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
})

export type CoachingReviewInsert = z.infer<typeof CoachingReviewInsertSchema>
export type CoachingReview = z.infer<typeof CoachingReviewSchema>

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Calcula la comisión y el neto de un monto de pago.
 */
export function calculateCoachingPaymentSplit(
  amountCents: number,
  commissionPct: number,
) {
  const commissionCents = Math.round((amountCents * commissionPct) / 100)
  const netCents = amountCents - commissionCents
  return { commissionCents, netCents }
}

/**
 * Verifica si una suscripción está activa actualmente.
 */
export function isSubscriptionActive(sub: CoachingSubscription): boolean {
  if (sub.status !== "active") return false
  if (!sub.starts_at || !sub.ends_at) return false
  const now = new Date()
  return now >= sub.starts_at && now <= sub.ends_at
}

/**
 * Verifica si un perk está habilitado en una suscripción.
 */
export function isPerkEnabled(perks: PerkContainer, perk: keyof PerkContainer): boolean {
  const p = perks[perk]
  return "enabled" in p && p.enabled === true
}

/**
 * Castea el JSONB de perks (de la BD) al tipo de dominio.
 * Framework-agnóstico: usable tanto en server como en client components.
 */
export function readPerks(json: unknown): PerkContainer {
  return (json ?? DEFAULT_PERKS) as PerkContainer
}

/**
 * Formatea un monto en centavos a la moneda indicada (es-AR).
 * Ej: formatMoney(1250000, "ARS") → "$ 12.500"
 */
export function formatMoney(cents: number, currency = DEFAULT_CURRENCY): string {
  const amount = cents / 100
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$ ${Math.round(amount).toLocaleString("es-AR")}`
  }
}

/**
 * Obtiene las iniciales de un nombre para avatar.
 */
export function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
