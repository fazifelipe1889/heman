import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser } from "@/lib/supabase/auth"
import { listRoutines } from "@/lib/db/routines"
import { getActivePlan } from "@/lib/db/plans"
import { WeeklyPlanner } from "@/features/plan/weekly-planner"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Planificación — EPHA",
}

export default async function PlanPage() {
  const supabase = await createClient()
  const user = await getCachedUser()

  const [routines, plan] = await Promise.all([
    listRoutines(supabase),
    user ? getActivePlan(supabase, user.id) : Promise.resolve(null),
  ])

  const days = plan?.days ?? []

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <PageHeader
        icon={CalendarDays}
        iconVariant="primary"
        title="Mi semana"
        description="Asigná una rutina a cada día."
        backHref="/train"
        backLabel="Entrenar"
      />

      {routines.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className="text-sm font-medium">Primero creá una rutina</p>
          <p className="text-sm text-muted-foreground">
            Necesitás al menos una rutina para armar tu semana.
          </p>
          <Link href="/routines" className={cn(buttonVariants(), "h-11")}>
            Ir a Rutinas
          </Link>
        </Card>
      ) : (
        <WeeklyPlanner routines={routines} days={days} />
      )}
    </div>
  )
}
