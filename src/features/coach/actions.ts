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
  updateCoachNotes,
} from "@/lib/db/coaching"
import type { PerkContainer, CoachingProgramStatus } from "@/lib/domain/coaching"
import { DEFAULT_COACH_COMMISSION_PCT } from "@/lib/domain/coaching"
import type { Json } from "@/lib/supabase/types"
import {
  coachProfileSchema,
  programSchema,
  planSchema,
  coachNotesSchema,
  type CoachProfileValues,
  type ProgramValues,
  type PlanValues,
  type CoachNotesValues,
} from "./schema"

export type ActionResult = { error?: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Construye el contenedor de perks a partir de los valores del formulario. */
function buildPerks(v: PlanValues): PerkContainer {
  return {
    chat: { enabled: v.chatEnabled },
    video_calls: {
      enabled: v.videoCallsCount > 0,
      count: v.videoCallsCount,
      minutes: v.videoCallMinutes,
    },
    routine: {
      enabled: v.routineEnabled,
      reconfigs_included: v.routineReconfigs,
    },
    supplements: { enabled: v.supplementsEnabled },
    progress_sharing: { enabled: v.progressSharingEnabled },
  }
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
      socials: buildSocials(v) as Json,
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
      socials: buildSocials(v) as Json,
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
      duration_days: v.durationDays,
      perks: buildPerks(v) as Json,
      routine_template_id: v.routineEnabled ? v.routineTemplateId ?? null : null,
      supplement_template_id: v.supplementsEnabled
        ? v.supplementTemplateId ?? null
        : null,
      is_visible: v.isVisible,
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
      duration_days: v.durationDays,
      perks: buildPerks(v) as Json,
      routine_template_id: v.routineEnabled ? v.routineTemplateId ?? null : null,
      supplement_template_id: v.supplementsEnabled
        ? v.supplementTemplateId ?? null
        : null,
      is_visible: v.isVisible,
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
