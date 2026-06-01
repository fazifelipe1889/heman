/**
 * Dominio puro y framework-agnóstico.
 * NO importar nada de React/Next aquí: este módulo debe poder reutilizarse
 * tal cual en un futuro shell nativo (Capacitor / React Native).
 *
 * Cada enum se expone como tupla `as const` (para validación/iteración en UI)
 * y como tipo unión derivado.
 */

export const SEXES = ["male", "female", "other"] as const
export type Sex = (typeof SEXES)[number]

export const GOALS = [
  "fat_loss",
  "hypertrophy",
  "strength",
  "endurance",
  "general",
] as const
export type Goal = (typeof GOALS)[number]

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const UNITS = ["metric", "imperial"] as const
export type Units = (typeof UNITS)[number]

export const TRAINING_TYPES = ["musculacion", "hiit", "cardio"] as const
export type TrainingType = (typeof TRAINING_TYPES)[number]

export const ROUTINE_TYPES = [
  "musculacion",
  "cardio_liss",
  "cardio_hiit",
  "cardio_custom",
] as const
export type RoutineType = (typeof ROUTINE_TYPES)[number]

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "lats",
  "traps",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "obliques",
  "full_body",
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "smith_machine",
  "kettlebell",
  "band",
  "bodyweight",
  "other",
] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const MOVEMENT_TYPES = ["compound", "isolation"] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export const EXERCISE_KINDS = ["strength", "cardio"] as const
export type ExerciseKind = (typeof EXERCISE_KINDS)[number]

/**
 * Tipos de serie. Soportan sistemas avanzados de hipertrofia/fuerza:
 * top sets, backoff sets, dropsets y autorregulación.
 */
export const SET_TYPES = [
  "normal",
  "warmup",
  "top_set",
  "backoff",
  "dropset",
  "amrap",
  "failure",
] as const
export type SetType = (typeof SET_TYPES)[number]

export const WORKOUT_STATUSES = ["active", "completed", "abandoned"] as const
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number]

export const WIKI_CATEGORIES = [
  "ejercicios",
  "nutricion",
  "tecnica",
  "suplementacion",
  "recuperacion",
  "conceptos",
] as const
export type WikiCategory = (typeof WIKI_CATEGORIES)[number]
