import Fuse from "fuse.js"
import type { Exercise } from "./exercises"
import { EXERCISE_SYNONYMS } from "./exercise-synonyms"

// Índice Fuse reutilizable (se instancia una vez por lista de ejercicios)
let fuseInstance: Fuse<Exercise> | null = null
let fuseExercises: Exercise[] | null = null

function getFuse(exercises: Exercise[]): Fuse<Exercise> {
  if (fuseInstance && fuseExercises === exercises) return fuseInstance
  fuseInstance = new Fuse(exercises, {
    keys: [
      { name: "name",                weight: 0.6 },
      { name: "equipment",           weight: 0.2 },
      { name: "tags",                weight: 0.15 },
      { name: "movement_type",       weight: 0.05 },
    ],
    threshold: 0.35,   // 0 = exacto, 1 = cualquier cosa; 0.35 tolera typos moderados
    distance: 120,     // busca coincidencias dentro de los primeros N caracteres
    minMatchCharLength: 2,
    includeScore: true,
    useExtendedSearch: false,
    ignoreLocation: true,
  })
  fuseExercises = exercises
  return fuseInstance
}

/**
 * Expande un término con sus sinónimos.
 * Retorna un array con el término original + todos los sinónimos que aplican.
 */
function expandQuery(raw: string): string[] {
  const term = raw.toLowerCase().trim()
  const extra: string[] = []

  for (const [key, synonyms] of Object.entries(EXERCISE_SYNONYMS)) {
    if (term.includes(key)) {
      extra.push(...synonyms)
    }
  }

  return [term, ...extra]
}

/**
 * Busca ejercicios combinando Fuse.js (fuzzy) con expansión de sinónimos.
 * - Sin query → devuelve todos.
 * - Con query → fuzzy match sobre name/equipment/tags/movement_type,
 *   unificando resultados de todos los términos expandidos.
 */
export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  const trimmed = query.trim()
  if (!trimmed) return exercises

  const fuse = getFuse(exercises)
  const terms = expandQuery(trimmed)

  // Buscar con cada término y unificar por id (mejor score gana)
  const scoreById = new Map<string, { exercise: Exercise; score: number }>()

  for (const term of terms) {
    const results = fuse.search(term)
    for (const r of results) {
      const id = r.item.id
      const score = r.score ?? 1
      const prev = scoreById.get(id)
      if (!prev || score < prev.score) {
        scoreById.set(id, { exercise: r.item, score })
      }
    }
  }

  // Ordenar por score ascendente (Fuse: 0 = mejor match)
  return [...scoreById.values()]
    .sort((a, b) => a.score - b.score)
    .map((v) => v.exercise)
}
