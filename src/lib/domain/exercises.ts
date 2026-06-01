/**
 * Dominio de ejercicios — framework-agnóstico.
 * Los valores coinciden exactamente con los del seed.sql (en español).
 */

// ─── Grupos musculares ────────────────────────────────────────────────────────

/** Todos los valores de primary_muscle_group presentes en el catálogo. */
export const MUSCLE_GROUPS_ES = [
  "Pecho",
  "Espalda Alta",
  "Espalda Baja",
  "Dorsal",
  "Trapecios",
  "Hombros",
  "Hombros (anterior)",
  "Hombros (lateral)",
  "Hombros (posterior)",
  "Manguito Rotador",
  "Biceps",
  "Triceps",
  "Braquiorradial",
  "Flexores del Antebrazo",
  "Extensores del Antebrazo",
  "Antebrazo",
  "Cuadriceps",
  "Isquiotibiales",
  "Gluteos",
  "Gluteos (medio)",
  "Aductores",
  "Gastrocnemio",
  "Soleo",
  "Core",
  "Recto Abdominal",
  "Recto Abdominal (inferior)",
  "Oblicuos",
  "TFL",
  "Variable",
] as const

export type MuscleGroupEs = (typeof MUSCLE_GROUPS_ES)[number]

/**
 * Agrupación visual para los filtros de la UI.
 * Cada grupo tiene un label y una lista de valores que coinciden con el seed.
 */
export const MUSCLE_GROUP_SECTIONS = [
  {
    label: "Pecho",
    values: ["Pecho"],
  },
  {
    label: "Espalda",
    values: ["Espalda Alta", "Espalda Baja", "Dorsal", "Trapecios"],
  },
  {
    label: "Hombros",
    values: [
      "Hombros",
      "Hombros (anterior)",
      "Hombros (lateral)",
      "Hombros (posterior)",
      "Manguito Rotador",
    ],
  },
  {
    label: "Brazos",
    values: [
      "Biceps",
      "Triceps",
      "Braquiorradial",
      "Flexores del Antebrazo",
      "Extensores del Antebrazo",
      "Antebrazo",
    ],
  },
  {
    label: "Piernas",
    values: ["Cuadriceps", "Isquiotibiales", "Aductores", "Gastrocnemio", "Soleo", "TFL"],
  },
  {
    label: "Glúteos",
    values: ["Gluteos", "Gluteos (medio)"],
  },
  {
    label: "Core",
    values: ["Core", "Recto Abdominal", "Recto Abdominal (inferior)", "Oblicuos"],
  },
] as const satisfies ReadonlyArray<{ label: string; values: readonly string[] }>

// ─── Equipamiento ────────────────────────────────────────────────────────────

export const EQUIPMENT_ES = [
  "Barra",
  "Mancuernas",
  "Maquina",
  "Maquina Smith",
  "Barra Hexagonal",
  "Cable",
  "Kettlebell",
  "Bandas Elasticas",
  "TRX / Suspension",
  "Peso Corporal",
] as const

export type EquipmentEs = (typeof EQUIPMENT_ES)[number]

// ─── Dificultad ───────────────────────────────────────────────────────────────

export const DIFFICULTIES_ES = ["Principiante", "Intermedio", "Avanzado"] as const
export type DifficultyEs = (typeof DIFFICULTIES_ES)[number]

export const DIFFICULTY_COLORS: Record<DifficultyEs, string> = {
  Principiante: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Intermedio:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Avanzado:     "bg-red-500/15 text-red-400 border-red-500/20",
}

// ─── Tipo Exercise (reflejo de la fila DB) ────────────────────────────────────

export type Exercise = {
  id: string
  name: string
  primary_muscle_group: string
  secondary_muscle_groups: string[]
  equipment: string
  movement_type: string
  difficulty: DifficultyEs
  instructions: string
  video_url: string | null
  image_url: string | null
  tags: string[]
  created_by: string | null
  parent_exercise_id: string | null
  created_at: string
  updated_at: string
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type ExerciseFilters = {
  search?: string
  muscleGroup?: string
  equipment?: string
  difficulty?: DifficultyEs
}
