/**
 * Dominio puro de progreso — sin imports de React ni Next.
 * Cálculos de rendimiento y metadatos de campos de revisiones corporales.
 */

// ---------------------------------------------------------------------------
// Cálculos de rendimiento
// ---------------------------------------------------------------------------

/** Fórmula de Epley para estimar 1RM a partir de peso y reps realizadas */
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/** Índice de Masa Corporal */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

// ---------------------------------------------------------------------------
// Metadatos de campos de revisión corporal
// ---------------------------------------------------------------------------

export type ReviewFieldMeta = {
  key: string
  label: string
  unit: string
  section: ReviewSection
  min?: number
  max?: number
  step?: number
  decimals?: number
}

export type ReviewSection =
  | "basicas"
  | "composicion"
  | "medidas"
  | "extremidades"
  | "salud"
  | "bienestar"

export const REVIEW_SECTION_LABELS: Record<ReviewSection, string> = {
  basicas:      "Medidas básicas",
  composicion:  "Composición corporal",
  medidas:      "Medidas corporales",
  extremidades: "Extremidades",
  salud:        "Salud",
  bienestar:    "Bienestar",
}

export const REVIEW_FIELDS: ReviewFieldMeta[] = [
  // Básicas
  { key: "weight_kg",        label: "Peso",                unit: "kg",   section: "basicas",      min: 20,   max: 300,  step: 0.1, decimals: 1 },
  { key: "height_cm",        label: "Altura",              unit: "cm",   section: "basicas",      min: 100,  max: 250,  step: 0.5, decimals: 1 },
  // Composición
  { key: "body_fat_pct",     label: "% Grasa corporal",    unit: "%",    section: "composicion",  min: 1,    max: 60,   step: 0.1, decimals: 1 },
  { key: "muscle_mass_kg",   label: "Masa muscular",        unit: "kg",   section: "composicion",  min: 10,   max: 150,  step: 0.1, decimals: 1 },
  { key: "bone_mass_kg",     label: "Masa ósea",            unit: "kg",   section: "composicion",  min: 0.5,  max: 10,   step: 0.1, decimals: 2 },
  { key: "water_pct",        label: "% Agua corporal",      unit: "%",    section: "composicion",  min: 20,   max: 80,   step: 0.1, decimals: 1 },
  { key: "visceral_fat",     label: "Grasa visceral",       unit: "idx",  section: "composicion",  min: 1,    max: 30,   step: 0.5, decimals: 1 },
  // Medidas corporales
  { key: "chest_cm",         label: "Pecho",                unit: "cm",   section: "medidas",      min: 50,   max: 200,  step: 0.5, decimals: 1 },
  { key: "waist_cm",         label: "Cintura",              unit: "cm",   section: "medidas",      min: 40,   max: 200,  step: 0.5, decimals: 1 },
  { key: "hips_cm",          label: "Cadera",               unit: "cm",   section: "medidas",      min: 50,   max: 200,  step: 0.5, decimals: 1 },
  { key: "abdomen_cm",       label: "Abdomen",              unit: "cm",   section: "medidas",      min: 40,   max: 200,  step: 0.5, decimals: 1 },
  { key: "neck_cm",          label: "Cuello",               unit: "cm",   section: "medidas",      min: 20,   max: 70,   step: 0.5, decimals: 1 },
  { key: "shoulder_cm",      label: "Hombros",              unit: "cm",   section: "medidas",      min: 60,   max: 180,  step: 0.5, decimals: 1 },
  // Extremidades
  { key: "arm_left_cm",      label: "Brazo izquierdo",      unit: "cm",   section: "extremidades", min: 15,   max: 70,   step: 0.5, decimals: 1 },
  { key: "arm_right_cm",     label: "Brazo derecho",        unit: "cm",   section: "extremidades", min: 15,   max: 70,   step: 0.5, decimals: 1 },
  { key: "forearm_left_cm",  label: "Antebrazo izquierdo",  unit: "cm",   section: "extremidades", min: 10,   max: 50,   step: 0.5, decimals: 1 },
  { key: "forearm_right_cm", label: "Antebrazo derecho",    unit: "cm",   section: "extremidades", min: 10,   max: 50,   step: 0.5, decimals: 1 },
  { key: "thigh_left_cm",    label: "Muslo izquierdo",      unit: "cm",   section: "extremidades", min: 30,   max: 100,  step: 0.5, decimals: 1 },
  { key: "thigh_right_cm",   label: "Muslo derecho",        unit: "cm",   section: "extremidades", min: 30,   max: 100,  step: 0.5, decimals: 1 },
  { key: "calf_left_cm",     label: "Pantorrilla izquierda",unit: "cm",   section: "extremidades", min: 20,   max: 70,   step: 0.5, decimals: 1 },
  { key: "calf_right_cm",    label: "Pantorrilla derecha",  unit: "cm",   section: "extremidades", min: 20,   max: 70,   step: 0.5, decimals: 1 },
  // Salud
  { key: "systolic_bp",      label: "Presión sistólica",    unit: "mmHg", section: "salud",        min: 60,   max: 220,  step: 1,   decimals: 0 },
  { key: "diastolic_bp",     label: "Presión diastólica",   unit: "mmHg", section: "salud",        min: 40,   max: 140,  step: 1,   decimals: 0 },
  { key: "resting_hr",       label: "Pulsaciones en reposo",unit: "bpm",  section: "salud",        min: 30,   max: 200,  step: 1,   decimals: 0 },
  { key: "spo2",             label: "Saturación O₂",        unit: "%",    section: "salud",        min: 85,   max: 100,  step: 0.1, decimals: 1 },
  // Bienestar
  { key: "sleep_hours",      label: "Horas de sueño",       unit: "h",    section: "bienestar",    min: 0,    max: 24,   step: 0.5, decimals: 1 },
  { key: "energy_level",     label: "Nivel de energía",     unit: "/10",  section: "bienestar",    min: 1,    max: 10,   step: 1,   decimals: 0 },
  { key: "stress_level",     label: "Nivel de estrés",      unit: "/10",  section: "bienestar",    min: 1,    max: 10,   step: 1,   decimals: 0 },
]

/** Campos agrupados por sección */
export function getFieldsBySection(): Map<ReviewSection, ReviewFieldMeta[]> {
  const map = new Map<ReviewSection, ReviewFieldMeta[]>()
  for (const f of REVIEW_FIELDS) {
    const arr = map.get(f.section) ?? []
    arr.push(f)
    map.set(f.section, arr)
  }
  return map
}
