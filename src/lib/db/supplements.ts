import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { calcDayStatus, weekdayOf, type DayCompliance } from "@/lib/domain/supplements"

export type Supplement =
  Database["public"]["Tables"]["supplements"]["Row"]
export type SupplementLog =
  Database["public"]["Tables"]["supplement_logs"]["Row"]

type Supabase = SupabaseClient<Database>

// ─── Suplementos ────────────────────────────────────────────────────────────

export async function listSupplements(supabase: Supabase): Promise<Supplement[]> {
  const { data } = await supabase
    .from("supplements")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
  return data ?? []
}

export async function getSupplement(
  supabase: Supabase,
  id: string,
): Promise<Supplement | null> {
  const { data } = await supabase
    .from("supplements")
    .select("*")
    .eq("id", id)
    .single()
  return data
}

export async function createSupplement(
  supabase: Supabase,
  userId: string,
  payload: {
    name: string
    dose: string
    notes: string
    days_of_week: number[]
    times_of_day: string[]
    color: string
  },
): Promise<{ id: string } | null> {
  // Asignar posición al final
  const { count } = await supabase
    .from("supplements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
  const position = count ?? 0

  const { data, error } = await supabase
    .from("supplements")
    .insert({ ...payload, user_id: userId, position })
    .select("id")
    .single()
  if (error) return null
  return data
}

export async function updateSupplement(
  supabase: Supabase,
  id: string,
  payload: Partial<
    Pick<Supplement, "name" | "dose" | "notes" | "days_of_week" | "times_of_day" | "color" | "is_active">
  >,
): Promise<boolean> {
  const { error } = await supabase
    .from("supplements")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
  return !error
}

export async function deleteSupplement(
  supabase: Supabase,
  id: string,
): Promise<boolean> {
  const { error } = await supabase.from("supplements").delete().eq("id", id)
  return !error
}

// ─── Logs diarios ───────────────────────────────────────────────────────────

/**
 * Devuelve los IDs de suplementos tomados en una fecha dada.
 */
export async function getLogsForDate(
  supabase: Supabase,
  logDate: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("supplement_logs")
    .select("supplement_id")
    .eq("log_date", logDate)
  return (data ?? []).map((r) => r.supplement_id)
}

/**
 * Marca un suplemento como tomado (inserta log).
 */
export async function markTaken(
  supabase: Supabase,
  userId: string,
  supplementId: string,
  logDate: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("supplement_logs")
    .upsert({ user_id: userId, supplement_id: supplementId, log_date: logDate })
  return !error
}

/**
 * Desmarca un suplemento (elimina log).
 */
export async function markUntaken(
  supabase: Supabase,
  supplementId: string,
  logDate: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("supplement_logs")
    .delete()
    .eq("supplement_id", supplementId)
    .eq("log_date", logDate)
  return !error
}

// ─── Calendario de adherencia ────────────────────────────────────────────────

/**
 * Calcula el cumplimiento diario para un rango de fechas (YYYY-MM-DD inclusive).
 * Retorna un Map de dateStr → DayCompliance.
 */
export async function getComplianceRange(
  supabase: Supabase,
  from: string,
  to: string,
): Promise<Map<string, DayCompliance>> {
  // 1. Suplementos activos (para saber qué días estaban programados)
  const { data: supps } = await supabase
    .from("supplements")
    .select("id, days_of_week")
    .eq("is_active", true)
  const supplements = supps ?? []

  // 2. Logs en el rango
  const { data: logs } = await supabase
    .from("supplement_logs")
    .select("supplement_id, log_date")
    .gte("log_date", from)
    .lte("log_date", to)
  const logSet = new Set(
    (logs ?? []).map((l) => `${l.supplement_id}|${l.log_date}`),
  )

  // 3. Iterar cada día del rango
  const result = new Map<string, DayCompliance>()
  const cursor = new Date(from + "T00:00:00")
  const end = new Date(to + "T00:00:00")

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const wd = weekdayOf(dateStr)

    const scheduled = supplements.filter((s) =>
      (s.days_of_week as number[]).includes(wd),
    ).length

    const taken = supplements.filter(
      (s) =>
        (s.days_of_week as number[]).includes(wd) &&
        logSet.has(`${s.id}|${dateStr}`),
    ).length

    result.set(dateStr, {
      date: dateStr,
      scheduled,
      taken,
      status: calcDayStatus(scheduled, taken),
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}
