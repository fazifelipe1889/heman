"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireUser, requireCoach } from "@/lib/auth/guards"
import {
  createCoachProfile,
  updateCoachProfile,
  getCoachProfile,
  isHandleAvailable,
  createCoachingProgram,
  updateCoachingProgram,
  setProgramStatus,
  deleteCoachingProgram,
  createCoachingPlan,
  updateCoachingPlan,
  deleteCoachingPlan,
  createProduct,
  updateProduct,
  upsertProgramContent,
  upsertRoutineTemplate,
  createCoachTransformation,
  updateCoachTransformation,
  deleteCoachTransformation,
  updateCoachNotes,
  getSubscriptionDetail,
  updateSubscriptionPersonalizedTemplate,
} from "@/lib/db/coaching"
import type { PerkContainer, CoachingProgramStatus } from "@/lib/domain/coaching"
import { DEFAULT_COACH_COMMISSION_PCT } from "@/lib/domain/coaching"
import type { Json } from "@/lib/supabase/types"
import {
  coachProfileSchema,
  programSchema,
  planSchema,
  productSchema,
  transformationSchema,
  coachNotesSchema,
  type CoachProfileValues,
  type ProgramValues,
  type PlanValues,
  type ProductValues,
  type TransformationValues,
  type CoachNotesValues,
} from "./schema"

export type ActionResult = { error?: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Campos de perks usados por buildPerks.
 * Acepta tanto PlanValues (con routineEnabled) como ProductValues (con routineMode).
 */
type PerkFormFields = {
  chatEnabled: boolean
  videoCallsCount: number
  videoCallMinutes: number
  /** Desde PlanValues (formulario de plan). */
  routineEnabled?: boolean
  /** Desde ProductValues (formulario de producto). */
  routineMode?: "none" | "adaptive" | "personalized"
  routineReconfigs: number
  supplementsEnabled: boolean
  progressSharingEnabled: boolean
}

/** Construye el contenedor de perks a partir de los valores del formulario. */
function buildPerks(v: PerkFormFields): PerkContainer {
  const routineOn =
    v.routineMode !== undefined ? v.routineMode !== "none" : (v.routineEnabled ?? false)
  const routineMode =
    v.routineMode && v.routineMode !== "none" ? v.routineMode : undefined

  return {
    chat: { enabled: v.chatEnabled },
    video_calls: {
      enabled: v.videoCallsCount > 0,
      count: v.videoCallsCount,
      minutes: v.videoCallMinutes,
    },
    routine: {
      enabled: routineOn,
      reconfigs_included: v.routineReconfigs,
      ...(routineMode ? { mode: routineMode } : {}),
    },
    supplements: { enabled: v.supplementsEnabled },
    progress_sharing: { enabled: v.progressSharingEnabled },
  }
}

/** Bullets de "qué incluye": limpia vacíos. */
function buildIncludes(v: { includes: { value: string }[] }): string[] {
  return v.includes.map((i) => i.value.trim()).filter(Boolean)
}

/** FAQ: descarta pares incompletos. */
function buildFaq(v: {
  faq: { question: string; answer: string }[]
}): { question: string; answer: string }[] {
  return v.faq
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
    .filter((f) => f.question && f.answer)
}

/** Bloques de contenido entregable: descarta bloques vacíos. */
function buildContent(v: ProductValues) {
  return v.content
    .map((b) => ({
      type: b.type,
      title: b.title?.trim() || undefined,
      body: b.body?.trim() || undefined,
      url: b.url?.trim() || undefined,
    }))
    .filter((b) => b.title || b.body || b.url)
}

/**
 * Construye el payload multi-adaptativo del template de rutina del coach.
 * Devuelve null si routineMode no es "adaptive" o no hay rutinas con grupos.
 */
function buildRoutineTemplatePayload(v: ProductValues): Json | null {
  if (v.routineMode !== "adaptive") return null
  const routines = v.routines
    .map((r) => ({
      name: r.name.trim() || "Rutina",
      groups: r.groups
        .filter((g) => g.muscleGroup.trim())
        .map((g) => ({
          muscleGroup: g.muscleGroup.trim(),
          exerciseCount: g.exerciseCount,
          sets: g.sets,
          notes: g.notes?.trim() || undefined,
        })),
    }))
    .filter((r) => r.groups.length > 0)
  if (routines.length === 0) return null
  const planning = v.routinePlanning
    .filter((p) => p.label.trim() && p.routineIndex < routines.length)
    .map((p) => ({ label: p.label.trim(), routineIndex: p.routineIndex }))
  return { mode: "multi_adaptive", routines, planning } as unknown as Json
}

/** Definición del formulario: descarta campos sin etiqueta. */
function buildIntakeForm(v: ProductValues) {
  return v.intakeForm
    .map((f) => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      required: f.required,
      ...(f.options?.length ? { options: f.options } : {}),
    }))
    .filter((f) => f.label)
}

function buildSocials(v: CoachProfileValues): Record<string, string> {
  const socials: Record<string, string> = {}
  if (v.instagram) socials.instagram = v.instagram
  if (v.youtube) socials.youtube = v.youtube
  if (v.tiktok) socials.tiktok = v.tiktok
  return socials
}

// ---------------------------------------------------------------------------
// Perfil de coach
// ---------------------------------------------------------------------------

export async function applyAsCoachAction(
  values: CoachProfileValues
): Promise<ActionResult> {
  const parsed = coachProfileSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del formulario." }

  const { supabase, user } = await requireUser()
  const v = parsed.data

  // No permitir doble alta.
  const existing = await getCoachProfile(supabase, user.id)
  if (existing) redirect("/coach")

  // Validar handle único.
  if (!(await isHandleAvailable(supabase, v.handle))) {
    return { error: "Ese @handle ya está en uso. Elegí otro." }
  }

  try {
    await createCoachProfile(supabase, user.id, {
      handle: v.handle,
      display_name: v.displayName,
      headline: v.headline || null,
      bio: v.bio || null,
      avatar_url: v.avatarUrl || null,
      cover_url: v.coverUrl || null,
      location: v.location || null,
      public_email: v.publicEmail || null,
      socials: buildSocials(v) as Json,
      faq: buildFaq(v) as Json,
      commission_pct: DEFAULT_COACH_COMMISSION_PCT,
    })
  } catch {
    return { error: "No se pudo crear el perfil de coach." }
  }

  redirect("/coach/pending")
}

export async function updateCoachProfileAction(
  values: CoachProfileValues
): Promise<ActionResult> {
  const parsed = coachProfileSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del formulario." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  // Si cambió el handle, validar disponibilidad.
  if (v.handle.toLowerCase() !== coach.handle.toLowerCase()) {
    if (!(await isHandleAvailable(supabase, v.handle))) {
      return { error: "Ese @handle ya está en uso. Elegí otro." }
    }
  }

  try {
    await updateCoachProfile(supabase, coach.id, {
      handle: v.handle,
      display_name: v.displayName,
      headline: v.headline || null,
      bio: v.bio || null,
      avatar_url: v.avatarUrl || null,
      cover_url: v.coverUrl || null,
      location: v.location || null,
      public_email: v.publicEmail || null,
      socials: buildSocials(v) as Json,
      faq: buildFaq(v) as Json,
    })
  } catch {
    return { error: "No se pudo actualizar el perfil." }
  }

  revalidatePath("/coach/settings")
  return {}
}

// ---------------------------------------------------------------------------
// Programas
// ---------------------------------------------------------------------------

export async function createProgramAction(
  values: ProgramValues
): Promise<ActionResult> {
  const parsed = programSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la asesoría." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  let id: string
  try {
    id = await createCoachingProgram(supabase, {
      coach_id: coach.id,
      title: v.title,
      slug: v.slug,
      tagline: v.tagline || null,
      description: v.description || null,
      category: v.category,
      level: v.level || null,
      cover_url: v.coverUrl || null,
      intro_video_url: v.introVideoUrl || null,
      includes: buildIncludes(v) as Json,
      faq: buildFaq(v) as Json,
    })
  } catch {
    return { error: "No se pudo crear la asesoría. ¿El slug ya existe?" }
  }

  revalidatePath("/coach/programs")
  redirect(`/coach/programs/${id}`)
}

export async function updateProgramAction(
  programId: string,
  values: ProgramValues
): Promise<ActionResult> {
  const parsed = programSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la asesoría." }

  const { supabase } = await requireCoach()
  const v = parsed.data

  try {
    await updateCoachingProgram(supabase, programId, {
      title: v.title,
      slug: v.slug,
      tagline: v.tagline || null,
      description: v.description || null,
      category: v.category,
      level: v.level || null,
      cover_url: v.coverUrl || null,
      intro_video_url: v.introVideoUrl || null,
      includes: buildIncludes(v) as Json,
      faq: buildFaq(v) as Json,
    })
  } catch {
    return { error: "No se pudo actualizar la asesoría." }
  }

  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

export async function setProgramStatusAction(
  programId: string,
  status: CoachingProgramStatus
): Promise<ActionResult> {
  const { supabase } = await requireCoach()
  try {
    await setProgramStatus(supabase, programId, status)
  } catch {
    return { error: "No se pudo cambiar el estado." }
  }
  revalidatePath(`/coach/programs/${programId}`)
  revalidatePath("/coach/programs")
  return {}
}

export async function deleteProgramAction(programId: string): Promise<void> {
  const { supabase } = await requireCoach()
  await deleteCoachingProgram(supabase, programId)
  revalidatePath("/coach/programs")
  redirect("/coach/programs")
}

// ---------------------------------------------------------------------------
// Productos (modelo plano: program + su único plan en una sola operación)
// ---------------------------------------------------------------------------

export async function createProductAction(
  values: ProductValues
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del producto." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  // Template de rutina (no-fatal si falla).
  let routineTemplateId: string | null = null
  const routinePayload = buildRoutineTemplatePayload(v)
  if (routinePayload) {
    try {
      routineTemplateId = await upsertRoutineTemplate(
        supabase,
        coach.id,
        v.title,
        null,
        routinePayload
      )
    } catch {
      // Ignorado: el producto se crea sin template si falla.
    }
  }

  let id: string
  try {
    id = await createProduct(
      supabase,
      {
        coach_id: coach.id,
        title: v.title,
        slug: v.slug,
        product_type: v.productType,
        tagline: v.tagline || null,
        short_description: v.shortDescription || null,
        description: v.description || null,
        category: JSON.stringify(v.categories),
        level: v.level || null,
        cover_url: v.coverUrl || null,
        intro_video_url: v.introVideoUrl || null,
        includes: buildIncludes(v) as Json,
        faq: buildFaq(v) as Json,
      },
      {
        coach_id: coach.id,
        name: v.title,
        description: v.shortDescription || null,
        price_cents: Math.round(v.price * 100),
        price_usd_cents: v.priceUsd != null ? Math.round(v.priceUsd * 100) : null,
        discount_pct: v.discountPct ?? 0,
        accent_color: v.accentColor || null,
        duration_days: v.durationDays,
        perks: buildPerks(v) as Json,
        routine_template_id: routineTemplateId,
        is_visible: true,
        is_featured: false,
      }
    )
  } catch {
    return { error: "No se pudo crear el producto. ¿El slug ya existe?" }
  }

  // El contenido es resiliente: si falla (p. ej. 0024 sin aplicar) no rompe el alta.
  try {
    await upsertProgramContent(supabase, {
      program_id: id,
      coach_id: coach.id,
      content: buildContent(v) as Json,
      intake_form: buildIntakeForm(v) as Json,
      nutrition_notes: v.nutritionNotes?.trim() || null,
    })
  } catch {
    // Ignorado a propósito.
  }

  revalidatePath("/coach/programs")
  redirect(`/coach/programs/${id}`)
}

export async function updateProductAction(
  programId: string,
  existingPlanId: string | null,
  existingTemplateId: string | null,
  values: ProductValues
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del producto." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  // Template de rutina (no-fatal si falla).
  let routineTemplateId: string | null = existingTemplateId
  const routinePayload = buildRoutineTemplatePayload(v)
  if (routinePayload) {
    try {
      routineTemplateId = await upsertRoutineTemplate(
        supabase,
        coach.id,
        v.title,
        null,
        routinePayload,
        existingTemplateId ?? undefined
      )
    } catch {
      // Ignorado: el producto se actualiza sin template si falla.
    }
  } else if (v.routineMode !== "adaptive") {
    routineTemplateId = null
  }

  try {
    await updateProduct(
      supabase,
      programId,
      {
        title: v.title,
        slug: v.slug,
        product_type: v.productType,
        tagline: v.tagline || null,
        short_description: v.shortDescription || null,
        description: v.description || null,
        category: JSON.stringify(v.categories),
        level: v.level || null,
        cover_url: v.coverUrl || null,
        intro_video_url: v.introVideoUrl || null,
        includes: buildIncludes(v) as Json,
        faq: buildFaq(v) as Json,
      },
      {
        coach_id: coach.id,
        name: v.title,
        description: v.shortDescription || null,
        price_cents: Math.round(v.price * 100),
        price_usd_cents: v.priceUsd != null ? Math.round(v.priceUsd * 100) : null,
        discount_pct: v.discountPct ?? 0,
        accent_color: v.accentColor || null,
        duration_days: v.durationDays,
        perks: buildPerks(v) as Json,
        routine_template_id: routineTemplateId,
        is_visible: true,
        is_featured: false,
      },
      existingPlanId
    )
  } catch {
    return { error: "No se pudo actualizar el producto." }
  }

  // El contenido es resiliente: si falla (p. ej. 0024 sin aplicar) no rompe la edición.
  try {
    await upsertProgramContent(supabase, {
      program_id: programId,
      coach_id: coach.id,
      content: buildContent(v) as Json,
      intake_form: buildIntakeForm(v) as Json,
      nutrition_notes: v.nutritionNotes?.trim() || null,
    })
  } catch {
    // Ignorado a propósito.
  }

  revalidatePath(`/coach/programs/${programId}`)
  revalidatePath("/coach/programs")
  return {}
}

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

export async function createPlanAction(
  programId: string,
  values: PlanValues
): Promise<ActionResult> {
  const parsed = planSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del plan." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  try {
    await createCoachingPlan(supabase, {
      program_id: programId,
      coach_id: coach.id,
      name: v.name,
      description: v.description || null,
      price_cents: Math.round(v.price * 100),
      price_usd_cents: v.priceUsd != null ? Math.round(v.priceUsd * 100) : null,
      duration_days: v.durationDays,
      perks: buildPerks(v) as Json,
      routine_template_id: v.routineEnabled ? v.routineTemplateId ?? null : null,
      supplement_template_id: v.supplementsEnabled
        ? v.supplementTemplateId ?? null
        : null,
      is_visible: v.isVisible,
      is_featured: v.isFeatured,
    })
  } catch {
    return { error: "No se pudo crear el plan." }
  }

  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

export async function updatePlanAction(
  planId: string,
  programId: string,
  values: PlanValues
): Promise<ActionResult> {
  const parsed = planSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del plan." }

  const { supabase } = await requireCoach()
  const v = parsed.data

  try {
    await updateCoachingPlan(supabase, planId, {
      name: v.name,
      description: v.description || null,
      price_cents: Math.round(v.price * 100),
      price_usd_cents: v.priceUsd != null ? Math.round(v.priceUsd * 100) : null,
      duration_days: v.durationDays,
      perks: buildPerks(v) as Json,
      routine_template_id: v.routineEnabled ? v.routineTemplateId ?? null : null,
      supplement_template_id: v.supplementsEnabled
        ? v.supplementTemplateId ?? null
        : null,
      is_visible: v.isVisible,
      is_featured: v.isFeatured,
    })
  } catch {
    return { error: "No se pudo actualizar el plan." }
  }

  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

export async function deletePlanAction(
  planId: string,
  programId: string
): Promise<ActionResult> {
  const { supabase } = await requireCoach()
  try {
    await deleteCoachingPlan(supabase, planId)
  } catch {
    return { error: "No se pudo eliminar el plan." }
  }
  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

// ---------------------------------------------------------------------------
// Transformaciones (prueba social)
// ---------------------------------------------------------------------------

export async function createTransformationAction(
  programId: string,
  values: TransformationValues
): Promise<ActionResult> {
  const parsed = transformationSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la transformación." }

  const { supabase, coach } = await requireCoach()
  const v = parsed.data

  try {
    await createCoachTransformation(supabase, {
      coach_id: coach.id,
      program_id: programId,
      client_name: v.clientName,
      before_url: v.beforeUrl || null,
      after_url: v.afterUrl || null,
      metric: v.metric || null,
      testimonial: v.testimonial || null,
    })
  } catch {
    return { error: "No se pudo crear la transformación." }
  }

  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

export async function updateTransformationAction(
  id: string,
  programId: string,
  values: TransformationValues
): Promise<ActionResult> {
  const parsed = transformationSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la transformación." }

  const { supabase } = await requireCoach()
  const v = parsed.data

  try {
    await updateCoachTransformation(supabase, id, {
      client_name: v.clientName,
      before_url: v.beforeUrl || null,
      after_url: v.afterUrl || null,
      metric: v.metric || null,
      testimonial: v.testimonial || null,
    })
  } catch {
    return { error: "No se pudo actualizar la transformación." }
  }

  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

export async function deleteTransformationAction(
  id: string,
  programId: string
): Promise<ActionResult> {
  const { supabase } = await requireCoach()
  try {
    await deleteCoachTransformation(supabase, id)
  } catch {
    return { error: "No se pudo eliminar la transformación." }
  }
  revalidatePath(`/coach/programs/${programId}`)
  return {}
}

// ---------------------------------------------------------------------------
// Notas sobre clientes
// ---------------------------------------------------------------------------

export async function saveCoachNotesAction(
  values: CoachNotesValues
): Promise<ActionResult> {
  const parsed = coachNotesSchema.safeParse(values)
  if (!parsed.success) return { error: "Notas inválidas." }

  const { supabase } = await requireCoach()
  try {
    await updateCoachNotes(supabase, parsed.data.subscriptionId, parsed.data.notes)
  } catch {
    return { error: "No se pudieron guardar las notas." }
  }

  revalidatePath(`/coach/clients/${parsed.data.subscriptionId}`)
  return {}
}

// ---------------------------------------------------------------------------
// Rutina personalizada por cliente
// ---------------------------------------------------------------------------

export type ClientRoutineValues = {
  routines: Array<{
    name: string
    exercises: Array<{
      exerciseName: string
      sets: number
      targetReps?: string
      notes?: string
    }>
  }>
  planning: Array<{
    label: string
    routineIndex: number
  }>
}

export async function saveClientRoutineAction(
  subscriptionId: string,
  existingTemplateId: string | null,
  values: ClientRoutineValues
): Promise<ActionResult> {
  const { supabase, coach } = await requireCoach()

  const sub = await getSubscriptionDetail(supabase, subscriptionId)
  if (!sub || sub.coach_id !== coach.id) return { error: "Sin acceso a esta suscripción." }

  const routines = values.routines
    .map((r) => ({
      name: r.name.trim() || "Rutina",
      exercises: r.exercises
        .filter((e) => e.exerciseName.trim())
        .map((e) => ({
          exerciseName: e.exerciseName.trim(),
          sets: e.sets,
          ...(e.targetReps?.trim() ? { targetReps: e.targetReps.trim() } : {}),
          ...(e.notes?.trim() ? { notes: e.notes.trim() } : {}),
        })),
    }))
    .filter((r) => r.exercises.length > 0)

  const planning = values.planning
    .filter((p) => p.label.trim() && p.routineIndex < routines.length)
    .map((p) => ({ label: p.label.trim(), routineIndex: p.routineIndex }))

  const payload: Json = { mode: "multi_personalized", routines, planning }

  try {
    const templateId = await upsertRoutineTemplate(
      supabase,
      coach.id,
      `Rutina personalizada — ${sub.program.title}`,
      null,
      payload,
      existingTemplateId ?? undefined
    )
    await updateSubscriptionPersonalizedTemplate(supabase, subscriptionId, templateId)
  } catch {
    return { error: "No se pudo guardar la rutina." }
  }

  revalidatePath(`/coach/clients/${subscriptionId}`)
  return {}
}
