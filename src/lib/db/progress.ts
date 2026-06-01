import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"
import { calculateE1RM } from "@/lib/domain/progress"

type Client = SupabaseClient<Database>

export type BodyReview = Database["public"]["Tables"]["body_reviews"]["Row"]
export type BodyReviewInsert = Database["public"]["Tables"]["body_reviews"]["Insert"]

// ---------------------------------------------------------------------------
// Revisiones corporales
// ---------------------------------------------------------------------------

export async function getBodyReviews(
  supabase: Client,
  userId: string
): Promise<BodyReview[]> {
  const { data, error } = await supabase
    .from("body_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("review_date", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createBodyReview(
  supabase: Client,
  userId: string,
  input: Omit<BodyReviewInsert, "user_id">
): Promise<string> {
  const { data, error } = await supabase
    .from("body_reviews")
    .insert({ ...input, user_id: userId })
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

export async function deleteBodyReview(
  supabase: Client,
  id: string
): Promise<void> {
  const { error } = await supabase.from("body_reviews").delete().eq("id", id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Progreso de ejercicios (e1RM por ejercicio a lo largo del tiempo)
// ---------------------------------------------------------------------------

export type E1RMPoint = { date: string; e1rm: number; bestVolume: number }
export type ExerciseE1RMSeries = { exerciseName: string; points: E1RMPoint[] }

export async function getExerciseProgressData(
  supabase: Client,
  userId: string
): Promise<ExerciseE1RMSeries[]> {
  // 1. Sesiones de musculación completadas
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .eq("type", "musculacion")
    .eq("status", "completed")
    .order("started_at")
  if (sErr) throw sErr
  if (!sessions?.length) return []

  const sessionIds = sessions.map((s) => s.id)
  const dateBySession = new Map(
    sessions.map((s) => [s.id, s.started_at.split("T")[0]])
  )

  // 2. Ejercicios de esas sesiones, con sus series
  type ExRow = {
    session_id: string
    exercise_name: string
    session_sets: { actual_weight: number | null; actual_reps: number | null; completed: boolean }[]
  }
  const { data: exRows, error: eErr } = await supabase
    .from("session_exercises")
    .select(`
      session_id,
      exercise_name,
      session_sets(actual_weight, actual_reps, completed)
    `)
    .in("session_id", sessionIds) as unknown as { data: ExRow[] | null; error: unknown }
  if (eErr) throw eErr

  // 3. Calcular e1RM máximo y mejor volumen de serie por ejercicio+fecha
  type ExPoint = { e1rm: number; bestVolume: number }
  const seriesMap = new Map<string, Map<string, ExPoint>>()

  for (const ex of exRows ?? []) {
    const date = dateBySession.get(ex.session_id)
    if (!date) continue

    const sets = (ex.session_sets ?? []).filter(
      (s) =>
        s.completed &&
        (s.actual_weight ?? 0) > 0 &&
        (s.actual_reps ?? 0) > 0
    )
    if (!sets.length) continue

    const maxE1RM = Math.max(
      ...sets.map((s) => calculateE1RM(s.actual_weight!, s.actual_reps!))
    )
    const maxBestVolume = Math.max(
      ...sets.map((s) => (s.actual_weight ?? 0) * (s.actual_reps ?? 0))
    )

    const exMap = seriesMap.get(ex.exercise_name) ?? new Map<string, ExPoint>()
    const prev = exMap.get(date)
    exMap.set(date, {
      e1rm:       Math.max(prev?.e1rm       ?? 0, maxE1RM),
      bestVolume: Math.max(prev?.bestVolume ?? 0, maxBestVolume),
    })
    seriesMap.set(ex.exercise_name, exMap)
  }

  // 4. Convertir a array — incluir ejercicios con ≥1 sesión
  return Array.from(seriesMap.entries())
    .map(([exerciseName, dateMap]) => ({
      exerciseName,
      points: Array.from(dateMap.entries())
        .map(([date, d]) => ({
          date,
          e1rm:       Math.round(d.e1rm       * 10) / 10,
          bestVolume: Math.round(d.bestVolume),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter(({ points }) => points.length >= 1)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 20)
}

// ---------------------------------------------------------------------------
// Volumen por ejercicio (para la vista de músculos)
// ---------------------------------------------------------------------------

export type ExerciseVolume = {
  exerciseName: string
  totalSets: number
  totalVolume: number   // kg totales (peso × reps)
  sessions: number
}

export async function getExerciseVolumeData(
  supabase: Client,
  userId: string
): Promise<ExerciseVolume[]> {
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "musculacion")
    .eq("status", "completed")
  if (sErr) throw sErr
  if (!sessions?.length) return []

  const sessionIds = sessions.map((s) => s.id)

  type ExRow2 = {
    exercise_name: string
    session_sets: { actual_weight: number | null; actual_reps: number | null; completed: boolean }[]
  }
  const { data: exRows, error: eErr } = await supabase
    .from("session_exercises")
    .select(`
      exercise_name,
      session_sets(actual_weight, actual_reps, completed)
    `)
    .in("session_id", sessionIds) as unknown as { data: ExRow2[] | null; error: unknown }
  if (eErr) throw eErr

  // Acumular por ejercicio
  const volumeMap = new Map<
    string,
    { sets: number; volume: number; sessionSet: Set<string> }
  >()

  for (const ex of exRows ?? []) {
    const completed = (ex.session_sets ?? []).filter((s) => s.completed)
    const volume = completed.reduce(
      (a, s) => a + (s.actual_weight ?? 0) * (s.actual_reps ?? 0),
      0
    )
    const existing = volumeMap.get(ex.exercise_name) ?? {
      sets: 0,
      volume: 0,
      sessionSet: new Set(),
    }
    existing.sets += completed.length
    existing.volume += volume
    volumeMap.set(ex.exercise_name, existing)
  }

  return Array.from(volumeMap.entries())
    .filter(([, d]) => d.sets > 0)
    .map(([exerciseName, d]) => ({
      exerciseName,
      totalSets: d.sets,
      totalVolume: Math.round(d.volume),
      sessions: 0,
    }))
    .sort((a, b) => b.totalSets - a.totalSets)
    .slice(0, 15)
}

// ---------------------------------------------------------------------------
// Progreso por grupo muscular — series y volumen a lo largo del tiempo
// ---------------------------------------------------------------------------

export type MuscleTimePoint  = { date: string; sets: number; volume: number }
export type MuscleTimeSeries = { muscle: string; points: MuscleTimePoint[] }

export async function getMuscleTimeSeriesData(
  supabase: Client,
  userId: string
): Promise<MuscleTimeSeries[]> {
  // 1. Sesiones completadas de musculación
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .eq("type", "musculacion")
    .eq("status", "completed")
    .order("started_at")
  if (sErr) throw sErr
  if (!sessions?.length) return []

  const sessionIds   = sessions.map((s) => s.id)
  const dateBySession = new Map(
    sessions.map((s) => [s.id, s.started_at.split("T")[0]])
  )

  // 2. Ejercicios con series y exercise_ref
  type ExRow = {
    session_id:   string
    exercise_ref: string | null
    session_sets: { actual_weight: number | null; actual_reps: number | null; completed: boolean }[]
  }
  const { data: exRows, error: eErr } = await supabase
    .from("session_exercises")
    .select(`
      session_id,
      exercise_ref,
      session_sets(actual_weight, actual_reps, completed)
    `)
    .in("session_id", sessionIds) as unknown as { data: ExRow[] | null; error: unknown }
  if (eErr) throw eErr
  if (!exRows?.length) return []

  // 3. Resolver exercise_ref → primary_muscle_group
  const exerciseRefs = [
    ...new Set(
      exRows.map((e) => e.exercise_ref).filter((r): r is string => r != null)
    ),
  ]
  if (!exerciseRefs.length) return []

  const { data: exercises, error: exErr } = await supabase
    .from("exercises")
    .select("id, primary_muscle_group")
    .in("id", exerciseRefs)
  if (exErr) throw exErr

  const muscleById = new Map(
    (exercises ?? []).map((e) => [e.id, e.primary_muscle_group])
  )

  // 4. Acumular (músculo, fecha) → { sets, volume }
  type MuscleDate = { sets: number; volume: number }
  const muscleMap = new Map<string, Map<string, MuscleDate>>()

  for (const ex of exRows) {
    if (!ex.exercise_ref) continue
    const muscle = muscleById.get(ex.exercise_ref)
    if (!muscle) continue
    const date = dateBySession.get(ex.session_id)
    if (!date) continue

    const completed = (ex.session_sets ?? []).filter((s) => s.completed)
    if (!completed.length) continue

    const volume = completed.reduce(
      (a, s) => a + (s.actual_weight ?? 0) * (s.actual_reps ?? 0),
      0
    )

    const dateMap = muscleMap.get(muscle) ?? new Map<string, MuscleDate>()
    const prev    = dateMap.get(date) ?? { sets: 0, volume: 0 }
    dateMap.set(date, { sets: prev.sets + completed.length, volume: prev.volume + volume })
    muscleMap.set(muscle, dateMap)
  }

  // 5. Convertir y ordenar por total de series descendente
  return Array.from(muscleMap.entries())
    .map(([muscle, dateMap]) => ({
      muscle,
      points: Array.from(dateMap.entries())
        .map(([date, d]) => ({
          date,
          sets:   d.sets,
          volume: Math.round(d.volume),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => {
      const aTotal = a.points.reduce((s, p) => s + p.sets, 0)
      const bTotal = b.points.reduce((s, p) => s + p.sets, 0)
      return bTotal - aTotal
    })
}
