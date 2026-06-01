"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCoachingPlan } from "@/lib/db/coaching"
import { provisionSubscription } from "@/lib/db/coaching-provisioning"

export type CheckoutResult = { error?: string }

/**
 * Activación MANUAL de una suscripción (DEV / sin pasarela real).
 *
 * Simula un pago aprobado y dispara el provisioning. Se reemplazará por el
 * webhook de MercadoPago cuando se integre la pasarela. Gated detrás del botón
 * "confirmar" del checkout; cualquier usuario logueado puede activarse, por eso
 * es solo para pruebas end-to-end.
 */
export async function activateSubscriptionManuallyAction(
  planId: string
): Promise<CheckoutResult> {
  const { supabase, user } = await requireUser()

  const plan = await getCoachingPlan(supabase, planId)
  if (!plan) return { error: "Plan no encontrado." }

  if (plan.coach_id === user.id) {
    return { error: "No podés contratar tu propia asesoría." }
  }

  // ¿Ya tiene una suscripción activa a este plan?
  const { count } = await supabase
    .from("coaching_subscription")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .eq("status", "active")
  if ((count ?? 0) > 0) {
    return { error: "Ya tenés una suscripción activa a este plan." }
  }

  // Provisioning con cliente privilegiado (bypassa RLS).
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return {
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para activar la suscripción.",
    }
  }

  try {
    await provisionSubscription(admin, {
      plan,
      userId: user.id,
      provider: "mercadopago",
      providerRef: `manual:${crypto.randomUUID()}`,
      rawEvent: { source: "manual_activation", at: new Date().toISOString() },
    })
  } catch {
    return { error: "No se pudo activar la suscripción." }
  }

  revalidatePath("/coaching/mi-asesoria")
  redirect("/coaching/mi-asesoria")
}
