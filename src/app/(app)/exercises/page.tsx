import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { getExercises } from "@/lib/db/exercises"
import { ExerciseBrowser } from "@/features/exercises/exercise-browser"

export const metadata: Metadata = {
  title: "Ejercicios — EPHA",
}

export default async function ExercisesPage() {
  const supabase = await createClient()
  // Cargar todos los globales de una vez (424 ejercicios ≈ trivial)
  const { exercises } = await getExercises(supabase, {}, 0)

  return <ExerciseBrowser exercises={exercises} />
}
