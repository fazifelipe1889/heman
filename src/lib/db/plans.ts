import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Plan, PlanDay, Routine } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export type PlanDayWithRoutine = PlanDay & { routine: Routine | null }
export type ActivePlan = Plan & { days: PlanDayWithRoutine[] }

export async function getActivePlan(
  supabase: Client,
  userId: string
): Promise<ActivePlan | null> {
  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!plan) return null

  const { data: dayRows, error: dErr } = await supabase
    .from("plan_days")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_of_week")
  if (dErr) throw dErr

  const routineIds = [
    ...new Set((dayRows ?? []).map((d) => d.routine_id).filter(Boolean)),
  ] as string[]

  const routinesById: Record<string, Routine> = {}
  if (routineIds.length > 0) {
    const { data: rs } = await supabase
      .from("routines")
      .select("*")
      .in("id", routineIds)
    ;(rs ?? []).forEach((r) => {
      routinesById[r.id] = r
    })
  }

  const days: PlanDayWithRoutine[] = (dayRows ?? []).map((d) => ({
    ...d,
    routine: d.routine_id ? (routinesById[d.routine_id] ?? null) : null,
  }))

  return { ...plan, days }
}

export async function ensureActivePlan(
  supabase: Client,
  userId: string
): Promise<string> {
  const { data: plan, error } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (plan) return plan.id

  const { data: created, error: cErr } = await supabase
    .from("plans")
    .insert({ user_id: userId, name: "Mi semana", is_active: true })
    .select("id")
    .single()
  if (cErr) throw cErr
  return created.id
}

/** Agrega una rutina a un día (varias rutinas por día permitidas). */
export async function addPlanDayRoutine(
  supabase: Client,
  planId: string,
  dayOfWeek: number,
  routineId: string
): Promise<void> {
  // Evitar duplicados de la misma rutina en el mismo día.
  const { data: existing } = await supabase
    .from("plan_days")
    .select("id")
    .eq("plan_id", planId)
    .eq("day_of_week", dayOfWeek)
    .eq("routine_id", routineId)
    .maybeSingle()
  if (existing) return

  const { count } = await supabase
    .from("plan_days")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("day_of_week", dayOfWeek)

  const { error } = await supabase.from("plan_days").insert({
    plan_id: planId,
    day_of_week: dayOfWeek,
    routine_id: routineId,
    position: count ?? 0,
  })
  if (error) throw error
}

/** Quita una asignación puntual (por id de plan_day). */
export async function removePlanDay(
  supabase: Client,
  planDayId: string
): Promise<void> {
  const { error } = await supabase.from("plan_days").delete().eq("id", planDayId)
  if (error) throw error
}

/** Limpia todas las rutinas asignadas a un día específico del plan. */
export async function clearPlanDay(
  supabase: Client,
  planId: string,
  dayOfWeek: number
): Promise<void> {
  const { error } = await supabase
    .from("plan_days")
    .delete()
    .eq("plan_id", planId)
    .eq("day_of_week", dayOfWeek)
  if (error) throw error
}
