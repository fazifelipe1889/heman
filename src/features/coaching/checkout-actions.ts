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
 * Solo disponible fuera de producción. Se reemplazará por el webhook de
 * MercadoPago cuando se integre la pasarela.
 */
export async function activateSubscriptionManuallyAction(
  planId: string
): Promise<CheckoutResult> {
  if (process.env.NODE_ENV === "production") {
    return { error: "El pago manual no está disponible en producción." }
  }
  const { supabase, user } = await requireUser()

  const plan = await getCoachingPlan(supabase, planId)
  if (!plan) return { error: "Plan no encontrado." }

  if (plan.coach_id === user.id) {
    return { error: "No podés contratar tu propia asesoría." }
  }

  // Una sola asesoría activa por usuario: si ya hay una (de cualquier plan),
  // hay que cancelarla antes de contratar otra.
  const { count } = await supabase
    .from("coaching_subscription")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")
  if ((count ?? 0) > 0) {
    return {
      error:
        "Ya tenés una asesoría activa. Cancelala desde «Mi asesoría» antes de contratar otra.",
    }
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
