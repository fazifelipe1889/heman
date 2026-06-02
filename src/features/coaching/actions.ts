"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import {
  getSubscriptionDetail,
  sendMessage,
  markThreadRead,
  getSubscriptionReview,
  createReview,
  cancelUserSubscription,
  saveIntakeAnswers,
  saveAdaptiveExercises,
} from "@/lib/db/coaching"
import type { Json } from "@/lib/supabase/types"
import {
  sendMessageSchema,
  reviewSchema,
  intakeAnswersSchema,
  adaptiveExercisesSchema,
  type SendMessageValues,
  type ReviewValues,
  type IntakeAnswersValues,
  type AdaptiveExercisesValues,
} from "./schema"

export type ActionResult = { error?: string }

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function sendMessageAction(
  values: SendMessageValues
): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse(values)
  if (!parsed.success) return { error: "Mensaje inválido." }

  const { supabase, user } = await requireUser()
  const v = parsed.data

  // Resolver la suscripción para determinar el rol del emisor y validar acceso.
  const sub = await getSubscriptionDetail(supabase, v.subscriptionId)
  if (!sub) return { error: "Suscripción no encontrada." }

  const isCoach = user.id === sub.coach_id
  const isClient = user.id === sub.user_id
  if (!isCoach && !isClient) return { error: "No tenés acceso a este chat." }

  if (sub.status !== "active") {
    return { error: "El chat solo está disponible con la asesoría activa." }
  }

  try {
    await sendMessage(supabase, {
      subscription_id: v.subscriptionId,
      sender_id: user.id,
      sender_role: isCoach ? "coach" : "user",
      body: v.body?.trim() || null,
      attachment_url: v.attachmentUrl || null,
      attachment_type: v.attachmentType || null,
    })
  } catch {
    return { error: "No se pudo enviar el mensaje." }
  }

  // Revalidar ambas vistas posibles del thread.
  revalidatePath("/coaching/mi-asesoria")
  revalidatePath(`/coach/clients/${v.subscriptionId}`)
  return {}
}

export async function markThreadReadAction(
  subscriptionId: string
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()

  const sub = await getSubscriptionDetail(supabase, subscriptionId)
  if (!sub) return { error: "Suscripción no encontrada." }

  const isCoach = user.id === sub.coach_id
  const isClient = user.id === sub.user_id
  if (!isCoach && !isClient) return { error: "Sin acceso." }

  try {
    await markThreadRead(supabase, subscriptionId, isCoach ? "coach" : "user")
  } catch {
    return { error: "No se pudo marcar como leído." }
  }
  return {}
}

// ---------------------------------------------------------------------------
// Suscripción
// ---------------------------------------------------------------------------

/** Cancela la asesoría activa del usuario (libera el cupo para contratar otra). */
export async function cancelSubscriptionAction(
  subscriptionId: string
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()

  const sub = await getSubscriptionDetail(supabase, subscriptionId)
  if (!sub || sub.user_id !== user.id) {
    return { error: "Suscripción no encontrada." }
  }
  if (sub.status !== "active") {
    return { error: "Esta asesoría no está activa." }
  }

  try {
    await cancelUserSubscription(supabase, subscriptionId, user.id)
  } catch {
    return { error: "No se pudo cancelar la asesoría." }
  }

  revalidatePath("/coaching/mi-asesoria")
  revalidatePath(`/coach/clients/${subscriptionId}`)
  return {}
}

// ---------------------------------------------------------------------------
// Reseñas
// ---------------------------------------------------------------------------

export async function createReviewAction(
  values: ReviewValues
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá la calificación." }

  const { supabase, user } = await requireUser()
  const v = parsed.data

  const sub = await getSubscriptionDetail(supabase, v.subscriptionId)
  if (!sub || sub.user_id !== user.id) {
    return { error: "Suscripción no encontrada." }
  }
  if (!["expired", "cancelled"].includes(sub.status)) {
    return { error: "Podés reseñar una vez que la asesoría haya finalizado." }
  }

  // Evitar duplicados.
  const existing = await getSubscriptionReview(supabase, v.subscriptionId)
  if (existing) return { error: "Ya dejaste una reseña para esta asesoría." }

  try {
    await createReview(supabase, {
      subscription_id: v.subscriptionId,
      program_id: sub.program_id,
      coach_id: sub.coach_id,
      user_id: user.id,
      rating: v.rating,
      comment: v.comment || null,
      image_url: v.imageUrl || null,
    })
  } catch {
    return { error: "No se pudo guardar la reseña." }
  }

  revalidatePath("/coaching/mi-asesoria")
  return {}
}

// ---------------------------------------------------------------------------
// Formulario al cliente (respuestas)
// ---------------------------------------------------------------------------

export async function saveIntakeAnswersAction(
  values: IntakeAnswersValues
): Promise<ActionResult> {
  const parsed = intakeAnswersSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del formulario." }

  const { supabase, user } = await requireUser()
  const v = parsed.data

  const sub = await getSubscriptionDetail(supabase, v.subscriptionId)
  if (!sub || sub.user_id !== user.id) {
    return { error: "Suscripción no encontrada." }
  }

  try {
    await saveIntakeAnswers(supabase, v.subscriptionId, user.id, v.answers as Json)
  } catch {
    return { error: "No se pudieron guardar tus datos." }
  }

  revalidatePath("/coaching/mi-asesoria")
  revalidatePath(`/coach/clients/${v.subscriptionId}`)
  return {}
}

// ---------------------------------------------------------------------------
// Rutina adaptativa (el cliente elige sus ejercicios)
// ---------------------------------------------------------------------------

export async function saveAdaptiveExercisesAction(
  values: AdaptiveExercisesValues
): Promise<ActionResult> {
  const parsed = adaptiveExercisesSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los ejercicios elegidos." }

  const { supabase } = await requireUser()
  const v = parsed.data

  // RLS sobre routine_exercises valida que la rutina sea del usuario.
  try {
    await saveAdaptiveExercises(supabase, v.routineId, v.exercises)
  } catch {
    return { error: "No se pudo guardar tu rutina." }
  }

  revalidatePath("/coaching/mi-asesoria")
  revalidatePath("/routines")
  return {}
}
