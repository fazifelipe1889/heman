/**
 * Dominio de Wiki Gym — puro, sin dependencias de React/Next.
 */

import type { WikiCategory } from "./enums"
import { WIKI_CATEGORIES } from "./enums"

export type WikiCategoryMeta = {
  value: WikiCategory
  label: string
  description: string
  color: string // clase Tailwind de color de fondo/badge
}

export const WIKI_CATEGORY_META: Record<WikiCategory, WikiCategoryMeta> = {
  ejercicios: {
    value: "ejercicios",
    label: "Ejercicios",
    description: "Técnica, variantes y ejecución correcta",
    color: "bg-blue-500/15 text-blue-400",
  },
  nutricion: {
    value: "nutricion",
    label: "Nutrición",
    description: "Alimentación, calorías y macros",
    color: "bg-green-500/15 text-green-400",
  },
  tecnica: {
    value: "tecnica",
    label: "Técnica",
    description: "Principios de entrenamiento y periodización",
    color: "bg-purple-500/15 text-purple-400",
  },
  suplementacion: {
    value: "suplementacion",
    label: "Suplementación",
    description: "Suplementos, evidencia y dosificación",
    color: "bg-orange-500/15 text-orange-400",
  },
  recuperacion: {
    value: "recuperacion",
    label: "Recuperación",
    description: "Descanso, sueño y manejo del estrés",
    color: "bg-cyan-500/15 text-cyan-400",
  },
  conceptos: {
    value: "conceptos",
    label: "Conceptos",
    description: "Glosario y fundamentos del fitness",
    color: "bg-zinc-500/15 text-zinc-400",
  },
}

export const WIKI_CATEGORY_LIST: WikiCategoryMeta[] = WIKI_CATEGORIES.map(
  (c) => WIKI_CATEGORY_META[c],
)
