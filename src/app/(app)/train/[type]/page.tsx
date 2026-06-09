import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Play } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser } from "@/lib/supabase/auth"
import { listRoutines } from "@/lib/db/routines"
import { getActivePlan } from "@/lib/db/plans"
import { todayWeekdayIndex, WEEKDAYS } from "@/lib/domain/training"
import type { RoutineType } from "@/lib/domain/enums"
import { ROUTINE_TYPE_META } from "@/features/routines/routine-type"
import { RoutineSearch } from "@/features/train/routine-search"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Entrenar — EPHA",
}

const TYPE_TITLES: Record<string, string> = {
  musculacion: "Musculación",
  cardio: "Cardio",
}

export default async function TrainTypePage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  if (type !== "musculacion" && type !== "cardio") notFound()

  const supabase = await createClient()
  const user = await getCachedUser()

  const [allRoutines, plan] = await Promise.all([
    listRoutines(supabase),
    user ? getActivePlan(supabase, user.id) : Promise.resolve(null),
  ])

  const inCategory = (t: RoutineType) =>
    type === "cardio" ? t.startsWith("cardio") : t === "musculacion"

  const routines = allRoutines.filter((r) => inCategory(r.type))

  const today = todayWeekdayIndex()
  const todayLabel = WEEKDAYS[today].label
  const seenToday = new Set<string>()
  const todayRoutines = (plan?.days ?? [])
    .filter((d) => d.day_of_week === today && d.routine && inCategory(d.routine.type))
    .map((d) => d.routine!)
    .filter((r) => {
      if (seenToday.has(r.id)) return false
      seenToday.add(r.id)
      return true
    })

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/train"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Entrenar
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {TYPE_TITLES[type]}
        </h1>
      </div>

      {/* Seguir planificación */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Seguir planificación
          </h2>
          <Link
            href="/plan"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <CalendarDays className="size-3.5" /> Editar semana
          </Link>
        </div>

        {todayRoutines.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todayRoutines.map((r) => (
              <Card key={r.id} className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {todayLabel} · Hoy
                  </p>
                  <p className="text-lg font-bold">{r.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ROUTINE_TYPE_META[r.type].label}
                  </p>
                </div>
                <Link
                  href={`/train/session/${r.id}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 w-full text-base"
                  )}
                >
                  <Play className="size-4 fill-current" /> Iniciar entrenamiento
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-sm font-medium">
              Hoy no tenés {TYPE_TITLES[type].toLowerCase()} en tu plan
            </p>
            <Link
              href="/plan"
              className="text-sm font-medium text-primary hover:underline"
            >
              Planificar mi semana
            </Link>
          </Card>
        )}
      </section>

      {/* Buscar rutina */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Buscar rutina
        </h2>
        {routines.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-sm font-medium">
              No tenés rutinas de {TYPE_TITLES[type].toLowerCase()}
            </p>
            <Link
              href={
                type === "cardio"
                  ? "/routines/new/cardio"
                  : "/routines/new/musculacion"
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              Crear una
            </Link>
          </Card>
        ) : (
          <RoutineSearch routines={routines} />
        )}
      </section>
    </div>
  )
}
