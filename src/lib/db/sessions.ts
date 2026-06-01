import type { SupabaseClient } from "@supabase/supabase-js"

import type { RoutineType } from "@/lib/domain/enums"
import type { Database } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export type SaveSetInput = {
  targetReps: string | null
  targetWeight: number | null
  targetRir: number | null
  actualReps: number | null
  actualWeight: number | null
  actualRir: number | null
  completed: boolean
}

export type SaveMusculacionSessionInput = {
  routineId: string | null
  name: string
  durationSeconds: number
  exercises: {
    exerciseName: string
    exerciseRef: string | null
    sets: SaveSetInput[]
  }[]
}

/**
 * Guarda una sesión de musculación completa de una sola vez (modelo online:
 * el HUD mantiene el estado en cliente y persiste al finalizar). Calcula el
 * volumen total (Σ reps×peso de las series completadas) en el servidor.
 */
export async function saveMusculacionSession(
  supabase: Client,
  userId: string,
  input: SaveMusculacionSessionInput
): Promise<string> {
  const totalVolume = input.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.reduce(
        (s, set) =>
          s +
          (set.completed && set.actualReps && set.actualWeight
            ? set.actualReps * set.actualWeight
            : 0),
        0
      ),
    0
  )

  const now = Date.now()
  const startedAt = new Date(now - input.durationSeconds * 1000).toISOString()
  const endedAt = new Date(now).toISOString()

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      routine_id: input.routineId,
      type: "musculacion",
      name: input.name,
      day_name: null,
      status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: input.durationSeconds,
      total_volume: totalVolume,
    })
    .select("id")
    .single()
  if (error) throw error

  for (let i = 0; i < input.exercises.length; i++) {
    const ex = input.exercises[i]
    const { data: se, error: seErr } = await supabase
      .from("session_exercises")
      .insert({
        session_id: session.id,
        position: i,
        exercise_name: ex.exerciseName,
        exercise_ref: ex.exerciseRef,
      })
      .select("id")
      .single()
    if (seErr) throw seErr

    if (ex.sets.length > 0) {
      const rows = ex.sets.map((set, j) => ({
        session_exercise_id: se.id,
        set_index: j,
        target_reps: set.targetReps,
        target_weight: set.targetWeight,
        target_rir: set.targetRir,
        actual_reps: set.actualReps,
        actual_weight: set.actualWeight,
        actual_rir: set.actualRir,
        completed: set.completed,
      }))
      const { error: setErr } = await supabase
        .from("session_sets")
        .insert(rows)
      if (setErr) throw setErr
    }
  }

  return session.id
}

// ---------------------------------------------------------------------------
// Guardar sesión de cardio (LISS, HIIT o Intervalos)
// ---------------------------------------------------------------------------
export type SaveCardioSessionInput = {
  routineId: string | null
  routineType: Extract<RoutineType, "cardio_liss" | "cardio_hiit" | "cardio_custom">
  name: string
  durationSeconds: number
  roundsCompleted?: number | null
  calories?: number | null
  distanceKm?: number | null
}

export async function saveCardioSession(
  supabase: Client,
  userId: string,
  input: SaveCardioSessionInput
): Promise<string> {
  const now = Date.now()
  const startedAt = new Date(now - input.durationSeconds * 1000).toISOString()
  const endedAt = new Date(now).toISOString()

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      routine_id: input.routineId,
      type: input.routineType,
      name: input.name,
      day_name: null,
      status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: input.durationSeconds,
      total_volume: null,
    })
    .select("id")
    .single()
  if (error) throw error

  const { error: cardioErr } = await supabase.from("session_cardio").insert({
    session_id: session.id,
    duration_seconds: input.durationSeconds,
    rounds_completed: input.roundsCompleted ?? null,
    intervals_completed: null,
    calories: input.calories ?? null,
    distance_km: input.distanceKm ?? null,
  })
  if (cardioErr) throw cardioErr

  return session.id
}
