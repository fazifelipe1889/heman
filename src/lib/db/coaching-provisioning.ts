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
  readRoutineTemplatePayload,
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

  // 7. Snapshot de rutina (si el plan incluye rutina personalizada/adaptativa).
  if (isPerkEnabled(perks, "routine") && plan.routine_template_id) {
    try {
      const { data: tpl } = await admin
        .from("coach_routine_template")
        .select("*")
        .eq("id", plan.routine_template_id)
        .maybeSingle()

      if (tpl) {
        const payload = readRoutineTemplatePayload(tpl.payload)
        let routineId: string | null = null

        if (payload?.mode === "personalized") {
          // Clonar la rutina con todos sus ejercicios en la cuenta del usuario.
          const { data: routine } = await admin
            .from("routines")
            .insert({
              user_id: userId,
              type: "musculacion",
              name: tpl.name,
              description: tpl.description ?? null,
            })
            .select("id")
            .single()

          if (routine) {
            routineId = routine.id
            const rows = payload.exercises.map((ex, i) => ({
              routine_id: routineId!,
              exercise_name: ex.exerciseName,
              exercise_ref: ex.exerciseRef ?? null,
              sets: ex.sets,
              target_reps: ex.targetReps ?? null,
              target_weight: ex.targetWeight ?? null,
              target_rir: ex.targetRir ?? null,
              rest_seconds: ex.restSeconds ?? null,
              notes: ex.notes ?? null,
              position: i,
            }))
            if (rows.length > 0) {
              await admin.from("routine_exercises").insert(rows)
            }
          }
        } else if (payload?.mode === "adaptive") {
          // Crear una rutina vacía; el cliente elige los ejercicios después.
          const { data: routine } = await admin
            .from("routines")
            .insert({
              user_id: userId,
              type: "musculacion",
              name: tpl.name,
              description: `Elegí tus ejercicios para cada músculo en tu asesoría.`,
            })
            .select("id")
            .single()

          if (routine) {
            routineId = routine.id
          }
        }

        if (routineId) {
          await admin
            .from("coaching_subscription")
            .update({ routine_id: routineId })
            .eq("id", subscriptionId)
        }
      }
    } catch {
      // No-fatal: un error en el snapshot no debe tirar el provisioning entero.
    }
  }

  return { subscriptionId, paymentId: payment.id, alreadyProcessed: false }
}
