import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { TrendingUp } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser } from "@/lib/supabase/auth"
import {
  getBodyReviews,
  getExerciseProgressData,
  getMuscleTimeSeriesData,
} from "@/lib/db/progress"
import { ProgressTabs } from "@/features/progress/progress-charts"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = {
  title: "Progreso — EPHA",
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect("/login")

  // Fetch paralelo
  const [reviews, exerciseSeries, muscleTimeSeries] = await Promise.all([
    getBodyReviews(supabase, user.id),
    getExerciseProgressData(supabase, user.id),
    getMuscleTimeSeriesData(supabase, user.id),
  ])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <PageHeader
        icon={TrendingUp}
        title="Progreso"
        description="Revisiones, fuerza y volumen"
      />

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
