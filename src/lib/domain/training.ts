/**
 * Constantes de dominio para rutinas y entrenamiento.
 * Framework-agnóstico. Los ejercicios son placeholders temporales: se
 * reemplazarán por la base de ejercicios real sin tocar el resto del código
 * (las rutinas guardan `exercise_name` + `exercise_ref`).
 */

export type Option = { value: string; label: string }

/** Divisiones musculares típicas. */
export const SPLITS: readonly Option[] = [
  { value: "ppl", label: "Push Pull Legs" },
  { value: "upper_lower", label: "Upper Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "torso_pierna", label: "Torso Pierna" },
  { value: "custom", label: "Personalizada" },
]

/** Modalidades de cardio LISS. */
export const CARDIO_MODALITIES: readonly Option[] = [
  { value: "treadmill_walk", label: "Caminata inclinada" },
  { value: "treadmill_run", label: "Cinta (trote)" },
  { value: "bike", label: "Bicicleta" },
  { value: "elliptical", label: "Elíptica" },
  { value: "rower", label: "Remo" },
  { value: "stair", label: "Escaladora" },
  { value: "outdoor", label: "Aire libre" },
]

/** Niveles de intensidad (cardio). */
export const INTENSITIES: readonly Option[] = [
  { value: "low", label: "Baja" },
  { value: "moderate", label: "Moderada" },
  { value: "high", label: "Alta" },
  { value: "max", label: "Máxima" },
]

/** Ejercicio HIIT principal típico. */
export const HIIT_EXERCISES: readonly Option[] = [
  { value: "sprints", label: "Sprints" },
  { value: "assault_bike", label: "Assault bike" },
  { value: "rower", label: "Remo" },
  { value: "jump_rope", label: "Cuerda" },
  { value: "burpees", label: "Burpees" },
  { value: "mountain_climbers", label: "Mountain climbers" },
]

export type PlaceholderExercise = {
  ref: string
  name: string
  muscle: string
}

/** Ejercicios placeholder para el constructor de musculación. */
export const PLACEHOLDER_EXERCISES: readonly PlaceholderExercise[] = [
  { ref: "press_banca", name: "Press banca", muscle: "chest" },
  { ref: "press_inclinado", name: "Press inclinado", muscle: "chest" },
  { ref: "sentadilla", name: "Sentadilla", muscle: "quads" },
  { ref: "prensa", name: "Prensa de piernas", muscle: "quads" },
  { ref: "peso_muerto", name: "Peso muerto", muscle: "hamstrings" },
  { ref: "dominadas", name: "Dominadas", muscle: "lats" },
  { ref: "remo_barra", name: "Remo con barra", muscle: "back" },
  { ref: "press_militar", name: "Press militar", muscle: "shoulders" },
  { ref: "elevaciones_laterales", name: "Elevaciones laterales", muscle: "shoulders" },
  { ref: "curl_biceps", name: "Curl bíceps", muscle: "biceps" },
  { ref: "extension_triceps", name: "Extensión tríceps", muscle: "triceps" },
]

export function labelFor(options: readonly Option[], value: string | null | undefined): string {
  if (!value) return "—"
  return options.find((o) => o.value === value)?.label ?? value
}

/** Días de la semana (0 = Lunes … 6 = Domingo). */
export const WEEKDAYS = [
  { value: 0, label: "Lunes", short: "Lun" },
  { value: 1, label: "Martes", short: "Mar" },
  { value: 2, label: "Miércoles", short: "Mié" },
  { value: 3, label: "Jueves", short: "Jue" },
  { value: 4, label: "Viernes", short: "Vie" },
  { value: 5, label: "Sábado", short: "Sáb" },
  { value: 6, label: "Domingo", short: "Dom" },
] as const

/** Índice del día actual con 0 = Lunes (Date.getDay() usa 0 = Domingo). */
export function todayWeekdayIndex(): number {
  return (new Date().getDay() + 6) % 7
}
