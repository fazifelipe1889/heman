/**
 * Etiquetas en español para los valores de enum del dominio.
 * Framework-agnóstico (sin React/Next): se usa tanto en selects de UI como
 * en futuras vistas nativas.
 */

import type {
  Difficulty,
  Equipment,
  ExerciseKind,
  ExperienceLevel,
  Goal,
  MovementType,
  MuscleGroup,
  Sex,
  TrainingType,
  Units,
} from "./enums"
import type {
  CoachingCategory,
  CoachStatus,
  CoachingProgramStatus,
  SubscriptionStatus,
  PaymentStatus,
  ProductType,
  IntakeFieldType,
} from "./coaching"

export const EXERCISE_KIND_LABELS: Record<ExerciseKind, string> = {
  strength: "Fuerza",
  cardio: "Cardio",
}

export const SEX_LABELS: Record<Sex, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
}

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: "Perder grasa",
  hypertrophy: "Ganar músculo",
  strength: "Fuerza",
  endurance: "Resistencia",
  general: "Salud general",
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export const UNITS_LABELS: Record<Units, string> = {
  metric: "Métrico (kg / cm)",
  imperial: "Imperial (lb / in)",
}

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  musculacion: "Musculación",
  hiit: "HIIT",
  cardio: "Cardio",
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Pecho",
  back: "Espalda",
  lats: "Dorsales",
  traps: "Trapecios",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  quads: "Cuádriceps",
  hamstrings: "Isquiotibiales",
  glutes: "Glúteos",
  calves: "Gemelos",
  abs: "Abdominales",
  obliques: "Oblicuos",
  full_body: "Cuerpo completo",
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barra",
  dumbbell: "Mancuernas",
  machine: "Máquina",
  cable: "Polea",
  smith_machine: "Multipower",
  kettlebell: "Kettlebell",
  band: "Banda elástica",
  bodyweight: "Peso corporal",
  other: "Otro",
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  compound: "Compuesto",
  isolation: "Aislamiento",
}

// ---------------------------------------------------------------------------
// Asesorías (coaching)
// ---------------------------------------------------------------------------

export const COACHING_CATEGORY_LABELS: Record<CoachingCategory, string> = {
  musculacion: "Musculación",
  recomposicion: "Recomposición",
  fuerza: "Fuerza",
  perdida_grasa: "Pérdida de grasa",
  cardio: "Cardio",
  mixto: "Mixto",
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  asesoria: "Asesoría",
  plan: "Plan",
}

/** Descripción corta del tipo de producto (para el selector "+ Crear"). */
export const PRODUCT_TYPE_DESCRIPTIONS: Record<ProductType, string> = {
  asesoria:
    "Servicio personalizado: armás rutina, suplementación y nutrición a medida para cada cliente.",
  plan: "Producto estático: el cliente compra información y una guía tuya ya armada.",
}

export const COACH_STATUS_LABELS: Record<CoachStatus, string> = {
  pending_review: "En revisión",
  active: "Activo",
  suspended: "Suspendido",
  rejected: "Rechazado",
}

export const COACHING_PROGRAM_STATUS_LABELS: Record<CoachingProgramStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending: "Pendiente",
  active: "Activa",
  paused: "Pausada",
  expired: "Finalizada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
  charged_back: "Contracargo",
}

/** Opciones (value/label) para selects de categoría y nivel. */
export const COACHING_CATEGORY_OPTIONS = (
  Object.keys(COACHING_CATEGORY_LABELS) as CoachingCategory[]
).map((value) => ({ value, label: COACHING_CATEGORY_LABELS[value] }))

export const COACHING_LEVEL_OPTIONS = [
  { value: "Principiante", label: "Principiante" },
  { value: "Intermedio", label: "Intermedio" },
  { value: "Avanzado", label: "Avanzado" },
]

export const INTAKE_FIELD_TYPE_LABELS: Record<IntakeFieldType, string> = {
  text: "Texto corto",
  textarea: "Texto largo",
  number: "Número",
  select: "Selección",
}

export const INTAKE_FIELD_TYPE_OPTIONS = (
  Object.keys(INTAKE_FIELD_TYPE_LABELS) as IntakeFieldType[]
).map((value) => ({ value, label: INTAKE_FIELD_TYPE_LABELS[value] }))
