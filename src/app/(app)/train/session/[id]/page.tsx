import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getRoutineDetail } from "@/lib/db/routines"
import { MusculacionSessionRunner } from "@/features/train/musculacion-session-runner"
import { CardioSessionRunner } from "@/features/train/cardio-session-runner"

export const metadata: Metadata = {
  title: "Entrenamiento — EPHA",
}

export default async function TrainSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const routine = await getRoutineDetail(supabase, id)
  if (!routine) notFound()

  if (routine.type === "musculacion") {
    return <MusculacionSessionRunner routine={routine} />
  }

  return <CardioSessionRunner routine={routine} />
}
