/**
 * Dominio de suplementación — puro, sin dependencias de React/Next.
 */

/** Claves de color predefinidas para los suplementos. */
export const SUPPLEMENT_COLORS = [
  "blue",
  "green",
  "purple",
  "orange",
  "red",
  "cyan",
  "yellow",
  "pink",
] as const
export type SupplementColor = (typeof SUPPLEMENT_COLORS)[number]

/** Clases Tailwind para cada color (bg suave + texto). */
export const SUPPLEMENT_COLOR_CLASSES: Record<
  SupplementColor,
  { bg: string; text: string; dot: string }
> = {
  blue:   { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400" },
  green:  { bg: "bg-green-500/15",  text: "text-green-400",  dot: "bg-green-400" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  orange: { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  red:    { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400" },
  cyan:   { bg: "bg-cyan-500/15",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  pink:   { bg: "bg-pink-500/15",   text: "text-pink-400",   dot: "bg-pink-400" },
}

export function getColorClasses(color: string) {
  return (
    SUPPLEMENT_COLOR_CLASSES[color as SupplementColor] ??
    SUPPLEMENT_COLOR_CLASSES.blue
  )
}

/** Momentos del día disponibles. */
export const TIMES_OF_DAY = [
  { value: "mañana",   label: "Mañana" },
  { value: "mediodía", label: "Mediodía" },
  { value: "tarde",    label: "Tarde" },
  { value: "noche",    label: "Noche" },
] as const

/**
 * Estado de adherencia para un día dado.
 * - `complete`  → todos los suplementos programados fueron tomados
 * - `partial`   → algunos tomados
 * - `missed`    → ninguno tomado (pero había suplementos programados)
 * - `none`      → no había suplementos programados ese día
 */
export type DayStatus = "complete" | "partial" | "missed" | "none"

export const DAY_STATUS_CLASSES: Record<DayStatus, string> = {
  complete: "bg-emerald-500/80 text-white",
  partial:  "bg-amber-500/80 text-white",
  missed:   "bg-red-500/80 text-white",
  none:     "bg-muted/30 text-muted-foreground",
}

export type DayCompliance = {
  date: string       // YYYY-MM-DD
  scheduled: number  // suplementos programados ese día
  taken: number      // suplementos tomados
  status: DayStatus
}

/**
 * Calcula el estado de adherencia a partir de conteos.
 */
export function calcDayStatus(scheduled: number, taken: number): DayStatus {
  if (scheduled === 0) return "none"
  if (taken === 0) return "missed"
  if (taken >= scheduled) return "complete"
  return "partial"
}

/**
 * Formatea una fecha Date a string YYYY-MM-DD en hora local.
 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Día de la semana local (0=Lun … 6=Dom) para una fecha YYYY-MM-DD.
 */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number)
  const jsDay = new Date(y, m - 1, d).getDay() // 0=Dom
  return (jsDay + 6) % 7                        // 0=Lun
}
