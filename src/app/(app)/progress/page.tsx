import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { TrendingUp } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import {
  getBodyReviews,
  getExerciseProgressData,
  getMuscleTimeSeriesData,
} from "@/lib/db/progress"
import { ProgressTabs } from "@/features/progress/progress-charts"

export const metadata: Metadata = {
  title: "Progreso — EPHA",
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch paralelo
  const [reviews, exerciseSeries, muscleTimeSeries] = await Promise.all([
    getBodyReviews(supabase, user.id),
    getExerciseProgressData(supabase, user.id),
    getMuscleTimeSeriesData(supabase, user.id),
  ])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progreso</h1>
          <p className="text-sm text-muted-foreground">
            Revisiones, fuerza y volumen
          </p>
        </div>
      </div>

      {/* Tabs con datos */}
      <ProgressTabs
        reviews={reviews}
        exerciseSeries={exerciseSeries}
        muscleTimeSeries={muscleTimeSeries}
        initialTab="revisiones"
      />
    </div>
  )
}
