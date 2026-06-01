/**
 * Motor de provisioning de asesorías.
 *
 * Convierte un pago aprobado en una suscripción activa. Es una operación
 * PRIVILEGIADA: debe ejecutarse con un cliente service_role (bypassa RLS),
 * ya que coaching_subscription / coaching_thread no tienen políticas de INSERT.
 *
 * Idempotente: si ya existe un pago con el mismo (provider, provider_ref),
 * no duplica nada y devuelve la suscripción existente.
 *
 * Secuencia:
 *   1. Idempotencia por referencia de pago.
 *   2. Calcular split (comisión plataforma / neto del coach).
 *   3. Registrar el pago (status 'approved').
 *   4. Crear la suscripción activa con snapshot de perks.
 *   5. Crear el thread de chat (si el plan incluye chat).
 *   6. (Pendiente) Snapshot de rutina cuando exista template.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, CoachingPlan } from "@/lib/supabase/types"
import {
  calculateCoachingPaymentSplit,
  readPerks,
  isPerkEnabled,
  DEFAULT_COACH_COMMISSION_PCT,
  type PaymentProvider,
} from "@/lib/domain/coaching"
import type { Json } from "@/lib/supabase/types"

type AdminClient = SupabaseClient<Database>

export type ProvisionParams = {
  plan: CoachingPlan
  userId: string
  provider: PaymentProvider
  /** Referencia única del pago en el proveedor (idempotencia). */
  providerRef: string
  /** Monto efectivamente cobrado en centavos (default: precio del plan). */
  amountCents?: number
  /** Evento crudo del proveedor para auditoría. */
  rawEvent?: Json
}

export type ProvisionResult = {
  subscriptionId: string
  paymentId: string
  alreadyProcessed: boolean
}

export async function provisionSubscription(
  admin: AdminClient,
  params: ProvisionParams
): Promise<ProvisionResult> {
  const { plan, userId, provider, providerRef } = params
  const amountCents = params.amountCents ?? plan.price_cents

  // 1. Idempotencia: ¿ya procesamos este pago?
  const { data: existingPayment, error: exErr } = await admin
    .from("coaching_payment")
    .select("id, subscription_id")
    .eq("provider", provider)
    .eq("provider_ref", providerRef)
    .maybeSingle()
  if (exErr) throw exErr

  if (existingPayment?.subscription_id) {
    return {
      subscriptionId: existingPayment.subscription_id,
      paymentId: existingPayment.id,
      alreadyProcessed: true,
    }
  }

  // 2. Comisión: tomar la del coach (fallback al default).
  const { data: coach } = await admin
    .from("coach_profiles")
    .select("commission_pct")
    .eq("id", plan.coach_id)
    .maybeSingle()
  const commissionPct = coach?.commission_pct ?? DEFAULT_COACH_COMMISSION_PCT
  const { commissionCents, netCents } = calculateCoachingPaymentSplit(
    amountCents,
    commissionPct
  )

  // 3. Fechas de la suscripción.
  const now = new Date()
  const endsAt = new Date(now.getTime() + plan.duration_days * 86_400_000)
  const perks = readPerks(plan.perks)

  // 4. Crear la suscripción activa con snapshot de perks.
  const { data: subscription, error: subErr } = await admin
    .from("coaching_subscription")
    .insert({
      user_id: userId,
      plan_id: plan.id,
      program_id: plan.program_id,
      coach_id: plan.coach_id,
      status: "active",
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      perks_snapshot: plan.perks,
    })
    .select("id")
    .single()
  if (subErr) throw subErr
  const subscriptionId = subscription.id

  // 5. Registrar el pago, ligado a la suscripción.
  const { data: payment, error: payErr } = await admin
    .from("coaching_payment")
    .insert({
      subscription_id: subscriptionId,
      user_id: userId,
      coach_id: plan.coach_id,
      program_id: plan.program_id,
      provider,
      provider_ref: providerRef,
      amount_cents: amountCents,
      currency: plan.currency,
      commission_cents: commissionCents,
      net_cents: netCents,
      status: "approved",
      raw_event: params.rawEvent ?? null,
    })
    .select("id")
    .single()
  if (payErr) throw payErr

  // Ligar último pago a la suscripción.
  await admin
    .from("coaching_subscription")
    .update({ last_payment_id: payment.id })
    .eq("id", subscriptionId)

  // 6. Thread de chat (si el plan lo incluye).
  if (isPerkEnabled(perks, "chat")) {
    await admin.from("coaching_thread").insert({
      subscription_id: subscriptionId,
      coach_id: plan.coach_id,
      user_id: userId,
    })
  }

  // TODO(routine snapshot): cuando exista coach_routine_template CRUD,
  // si plan.routine_template_id y perks.routine.enabled → clonar la rutina
  // en `routines` del usuario y guardar routine_id en la suscripción.

  return { subscriptionId, paymentId: payment.id, alreadyProcessed: false }
}
