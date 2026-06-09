import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { getAllExercises } from "@/lib/db/exercises"
import { ExerciseBrowser } from "@/features/exercises/exercise-browser"

export const metadata: Metadata = {
  title: "Ejercicios — EPHA",
}

export default async function ExercisesPage() {
  const supabase = await createClient()
  // Cargar todo el catálogo de una vez (~252 ejercicios ≈ trivial); el browser
  // filtra y busca client-side.
  const exercises = await getAllExercises(supabase)

  return <ExerciseBrowser exercises={exercises} />
}
