import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  Database,
  Routine,
  RoutineCustomConfig,
  RoutineExercise,
  RoutineHiit,
  RoutineIntervalBlock,
  RoutineLiss,
} from "@/lib/supabase/types"
import type { ExperienceLevel, Goal, RoutineType } from "@/lib/domain/enums"

type Client = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Tipos de entrada (los reciben las server actions ya validados con Zod)
// ---------------------------------------------------------------------------
export type MusculacionInput = {
  name: string
  description?: string | null
  goal?: Goal | null
  experienceLevel?: ExperienceLevel | null
  exercises: {
    exerciseName: string
    exerciseRef?: string | null
    sets: number
    targetReps?: string | null
    targetWeight?: number | null
    targetRir?: number | null
    restSeconds?: number | null
    notes?: string | null
  }[]
}

export type LissInput = {
  name: string
  description?: string | null
  modality?: string | null
  durationMin?: number | null
  intensity?: string | null
  incline?: number | null
  speed?: number | null
  distanceKm?: number | null
  targetCalories?: number | null
  weeklyFrequency?: number | null
}

export type HiitInput = {
  name: string
  description?: string | null
  mainExercise?: string | null
  rounds?: number | null
  workSeconds?: number | null
  restSeconds?: number | null
  intervals?: number | null
  intensity?: string | null
}

export type CustomIntervalInput = {
  name: string
  description?: string | null
  rounds?: number | null
  blocks: {
    name: string
    durationSeconds: number
    intensity?: string | null
  }[]
}

export type RoutineDetail = Routine & {
  exercises: RoutineExercise[]
  liss: RoutineLiss | null
  hiit: RoutineHiit | null
  customConfig: RoutineCustomConfig | null
  blocks: RoutineIntervalBlock[]
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------
export async function listRoutines(
  supabase: Client,
  filters: { type?: RoutineType } = {}
): Promise<Routine[]> {
  let query = supabase.from("routines").select("*").eq("is_archived", false)
  if (filters.type) query = query.eq("type", filters.type)

  const { data, error } = await query
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getRoutineDetail(
  supabase: Client,
  id: string
): Promise<RoutineDetail | null> {
  const { data: routine, error } = await supabase
    .from("routines")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!routine) return null

  let exercises: RoutineExercise[] = []
  let liss: RoutineLiss | null = null
  let hiit: RoutineHiit | null = null
  let customConfig: RoutineCustomConfig | null = null
  let blocks: RoutineIntervalBlock[] = []

  if (routine.type === "musculacion") {
    const { data, error: exErr } = await supabase
      .from("routine_exercises")
      .select("*")
      .eq("routine_id", id)
      .order("position")
    if (exErr) throw exErr
    exercises = data ?? []
  } else if (routine.type === "cardio_liss") {
    const { data } = await supabase
      .from("routine_liss")
      .select("*")
      .eq("routine_id", id)
      .maybeSingle()
    liss = data
  } else if (routine.type === "cardio_hiit") {
    const { data } = await supabase
      .from("routine_hiit")
      .select("*")
      .eq("routine_id", id)
      .maybeSingle()
    hiit = data
  } else if (routine.type === "cardio_custom") {
    const [configRes, blocksRes] = await Promise.all([
      supabase
        .from("routine_custom_config")
        .select("*")
        .eq("routine_id", id)
        .maybeSingle(),
      supabase
        .from("routine_interval_blocks")
        .select("*")
        .eq("routine_id", id)
        .order("position"),
    ])
    customConfig = configRes.data
    blocks = blocksRes.data ?? []
  }

  return { ...routine, exercises, liss, hiit, customConfig, blocks }
}

// ---------------------------------------------------------------------------
// Escrituras
// ---------------------------------------------------------------------------
export async function createMusculacionRoutine(
  supabase: Client,
  userId: string,
  input: MusculacionInput
): Promise<string> {
  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      type: "musculacion",
      name: input.name,
      description: input.description ?? null,
      goal: input.goal ?? null,
      experience_level: input.experienceLevel ?? null,
    })
    .select("id")
    .single()
  if (error) throw error

  if (input.exercises.length > 0) {
    const rows = input.exercises.map((ex, i) => ({
      routine_id: routine.id,
      position: i,
      exercise_name: ex.exerciseName,
      exercise_ref: ex.exerciseRef ?? null,
      sets: ex.sets,
      target_reps: ex.targetReps ?? null,
      target_weight: ex.targetWeight ?? null,
      target_rir: ex.targetRir ?? null,
      rest_seconds: ex.restSeconds ?? null,
      notes: ex.notes ?? null,
    }))
    const { error: exErr } = await supabase
      .from("routine_exercises")
      .insert(rows)
    if (exErr) throw exErr
  }

  return routine.id
}

export async function createLissRoutine(
  supabase: Client,
  userId: string,
  input: LissInput
): Promise<string> {
  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      type: "cardio_liss",
      name: input.name,
      description: input.description ?? null,
    })
    .select("id")
    .single()
  if (error) throw error

  const { error: lErr } = await supabase.from("routine_liss").insert({
    routine_id: routine.id,
    modality: input.modality ?? null,
    duration_min: input.durationMin ?? null,
    intensity: input.intensity ?? null,
    incline: input.incline ?? null,
    speed: input.speed ?? null,
    distance_km: input.distanceKm ?? null,
    target_calories: input.targetCalories ?? null,
    weekly_frequency: input.weeklyFrequency ?? null,
  })
  if (lErr) throw lErr

  return routine.id
}

export async function createHiitRoutine(
  supabase: Client,
  userId: string,
  input: HiitInput
): Promise<string> {
  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      type: "cardio_hiit",
      name: input.name,
      description: input.description ?? null,
    })
    .select("id")
    .single()
  if (error) throw error

  const { error: hErr } = await supabase.from("routine_hiit").insert({
    routine_id: routine.id,
    main_exercise: input.mainExercise ?? null,
    rounds: input.rounds ?? null,
    work_seconds: input.workSeconds ?? null,
    rest_seconds: input.restSeconds ?? null,
    intervals: input.intervals ?? null,
    intensity: input.intensity ?? null,
  })
  if (hErr) throw hErr

  return routine.id
}

export async function createCustomIntervalRoutine(
  supabase: Client,
  userId: string,
  input: CustomIntervalInput
): Promise<string> {
  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      type: "cardio_custom",
      name: input.name,
      description: input.description ?? null,
    })
    .select("id")
    .single()
  if (error) throw error

  const { error: cfgErr } = await supabase.from("routine_custom_config").insert({
    routine_id: routine.id,
    rounds: input.rounds ?? 1,
  })
  if (cfgErr) throw cfgErr

  if (input.blocks.length > 0) {
    const rows = input.blocks.map((b, i) => ({
      routine_id: routine.id,
      position: i,
      name: b.name,
      duration_seconds: b.durationSeconds,
      intensity: b.intensity ?? null,
    }))
    const { error: bErr } = await supabase
      .from("routine_interval_blocks")
      .insert(rows)
    if (bErr) throw bErr
  }

  return routine.id
}

export async function setFavorite(
  supabase: Client,
  id: string,
  value: boolean
): Promise<void> {
  const { error } = await supabase
    .from("routines")
    .update({ is_favorite: value })
    .eq("id", id)
  if (error) throw error
}

export async function deleteRoutine(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("routines").delete().eq("id", id)
  if (error) throw error
}
