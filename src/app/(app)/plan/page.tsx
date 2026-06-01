import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CalendarDays } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listRoutines } from "@/lib/db/routines"
import { getActivePlan } from "@/lib/db/plans"
import { WeeklyPlanner } from "@/features/plan/weekly-planner"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Planificación — EPHA",
}

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [routines, plan] = await Promise.all([
    listRoutines(supabase),
    user ? getActivePlan(supabase, user.id) : Promise.resolve(null),
  ])

  const days = plan?.days ?? []

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/train"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Entrenar
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CalendarDays className="size-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Mi semana</h1>
            <p className="text-sm text-muted-foreground">
              Asigná una rutina a cada día.
            </p>
          </div>
        </div>
      </div>

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
