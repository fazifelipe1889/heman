import type { SupabaseClient } from "@supabase/supabase-js"
import type { Exercise, ExerciseFilters } from "@/lib/domain/exercises"

const PAGE_SIZE = 40

// ─── Ejercicios custom (propios del usuario) ───────────────────────────────────
// Los ejercicios custom NO usan una tabla aparte: viven en la misma tabla
// `exercises` con `created_by = auth.uid()`. El catálogo global tiene
// `created_by IS NULL`. La RLS (migración 0010) ya garantiza que cada usuario
// solo vea/modifique los suyos, por lo que el picker y `getExercises` los
// incluyen automáticamente sin lógica de merge adicional.

/** Datos mínimos para crear un ejercicio custom desde el picker. */
export type NewCustomExercise = {
  name: string
  primaryMuscleGroup?: string
  equipment?: string
  instructions?: string
}

/**
 * Crea un ejercicio custom propiedad del usuario (created_by = ownerId).
 * Completa con defaults sensatos las columnas NOT NULL que el form liviano no pide.
 * Devuelve la fila creada para hacer optimistic update en el picker.
 */
export async function createCustomExercise(
  supabase: SupabaseClient,
  ownerId: string,
  data: NewCustomExercise,
): Promise<Exercise> {
  const { data: row, error } = await supabase
    .from("exercises")
    .insert({
      name: data.name.trim(),
      primary_muscle_group: data.primaryMuscleGroup?.trim() || "Variable",
      secondary_muscle_groups: [],
      equipment: data.equipment?.trim() || "Peso Corporal",
      movement_type: "Personalizado",
      difficulty: "Intermedio",
      instructions: data.instructions?.trim() ?? "",
      tags: [],
      created_by: ownerId,
    })
    .select("*")
    .single()

  if (error) throw error
  return row as Exercise
}

/**
 * Elimina un ejercicio custom. La RLS de DELETE garantiza que solo se borren
 * los propios (created_by = auth.uid()); el catálogo global es inmutable.
 */
export async function deleteCustomExercise(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("exercises").delete().eq("id", id)
  if (error) throw error
}

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
 * Devuelve el catálogo global completo (created_by IS NULL) + los del usuario,
 * sin paginar. Pensado para el browser de ejercicios, que filtra y busca
 * client-side sobre todo el catálogo (~252 filas, trivial).
 */
export async function getAllExercises(
  supabase: SupabaseClient,
): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name")

  if (error) throw error
  return (data ?? []) as Exercise[]
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
