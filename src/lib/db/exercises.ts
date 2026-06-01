import type { SupabaseClient } from "@supabase/supabase-js"
import type { Exercise, ExerciseFilters } from "@/lib/domain/exercises"

const PAGE_SIZE = 40

/**
 * Lista ejercicios con filtros opcionales y paginación.
 * Devuelve ejercicios globales (created_by IS NULL) y los creados por el usuario.
 */
export async function getExercises(
  supabase: SupabaseClient,
  filters: ExerciseFilters = {},
  page = 0,
): Promise<{ exercises: Exercise[]; count: number }> {
  let query = supabase
    .from("exercises")
    .select("*", { count: "exact" })
    .order("name")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`)
  }
  if (filters.muscleGroup) {
    query = query.eq("primary_muscle_group", filters.muscleGroup)
  }
  if (filters.equipment) {
    query = query.eq("equipment", filters.equipment)
  }
  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty)
  }

  const { data, error, count } = await query

  if (error) throw error
  return { exercises: (data ?? []) as Exercise[], count: count ?? 0 }
}

/**
 * Búsqueda rápida para el selector del builder (devuelve solo id + name + primary_muscle_group).
 */
export async function searchExercises(
  supabase: SupabaseClient,
  search: string,
  limit = 20,
): Promise<Pick<Exercise, "id" | "name" | "primary_muscle_group" | "equipment">[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, primary_muscle_group, equipment")
    .ilike("name", `%${search.trim()}%`)
    .order("name")
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Pick<Exercise, "id" | "name" | "primary_muscle_group" | "equipment">[]
}

/** Obtiene un ejercicio por id. */
export async function getExercise(
  supabase: SupabaseClient,
  id: string,
): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data as Exercise
}
