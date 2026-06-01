import type { Metadata } from "next"
import Link from "next/link"
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  Plus,
  Star,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listRoutines } from "@/lib/db/routines"
import { ROUTINE_TYPE_META } from "@/features/routines/routine-type"
import { RoutineListActions } from "@/features/routines/routine-list-actions"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Rutinas — EPHA",
}

export default async function RoutinesPage() {
  const supabase = await createClient()
  const routines = await listRoutines(supabase)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
        <p className="text-sm text-muted-foreground">
          Creá rutinas y organizalas en tu semana.
        </p>
      </div>

      {/* Opciones de creación */}
      <div className="grid grid-cols-2 gap-3">
        {/* Musculación */}
        <Link
          href="/routines/new/musculacion"
          className="flex h-36 flex-col justify-between overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Dumbbell className="size-7" />
          <div>
            <p className="text-base font-bold leading-tight">Musculación</p>
            <p className="flex items-center gap-1 text-xs opacity-80">
              <Plus className="size-3" /> Crear rutina
            </p>
          </div>
        </Link>

        {/* Cardio */}
        <Link
          href="/routines/new/cardio"
          className="flex h-36 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors active:scale-[0.98] hover:border-primary/50"
        >
          <HeartPulse className="size-7 text-primary" />
          <div>
            <p className="text-base font-bold leading-tight">Cardio</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Plus className="size-3" /> LISS o HIIT
            </p>
          </div>
        </Link>

        {/* Planificación — ocupa todo el ancho */}
        <Link
          href="/plan"
          className="col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors active:scale-[0.98] hover:border-primary/50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="font-bold">Planificación semanal</p>
            <p className="text-sm text-muted-foreground">
              Organizá tus rutinas en la semana
            </p>
          </div>
          <ChevronRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      {/* Rutinas guardadas */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Mis rutinas
        </h2>

        {routines.length === 0 ? (
          <Card className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <p className="text-sm font-medium">Todavía no tenés rutinas</p>
            <p className="text-sm text-muted-foreground">
              Creá tu primera con los botones de arriba.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {routines.map((r) => {
              const meta = ROUTINE_TYPE_META[r.type]
              const Icon = meta.icon
              return (
                <Card key={r.id} className="flex flex-row items-center gap-3 p-3 transition-colors hover:border-primary/50">
                  <Link href={`/routines/${r.id}`} className="flex min-w-0 flex-1 flex-row items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold">{r.name}</p>
                        {r.is_favorite && (
                          <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {meta.label}
                      </p>
                    </div>
                  </Link>
                  <RoutineListActions id={r.id} isFavorite={r.is_favorite} />
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
