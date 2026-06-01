import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, FlaskConical, Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getLogsForDate, listSupplements } from "@/lib/db/supplements"
import { toLocalDateString, weekdayOf } from "@/lib/domain/supplements"
import { SupplementChecklist } from "@/features/supplements/supplement-checklist"
import { SupplementListItem } from "@/features/supplements/supplement-list-item"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Suplementación — EPHA",
}

export default async function SupplementsPage() {
  const supabase = await createClient()
  const today = toLocalDateString(new Date())
  const todayWd = weekdayOf(today)

  const [allSupplements, takenIds] = await Promise.all([
    listSupplements(supabase),
    getLogsForDate(supabase, today),
  ])

  const active = allSupplements.filter((s) => s.is_active)
  const inactive = allSupplements.filter((s) => !s.is_active)

  // Suplementos programados para hoy
  const todaySupplements = active.filter((s) =>
    (s.days_of_week as number[]).includes(todayWd),
  )

  const takenCount = todaySupplements.filter((s) => takenIds.includes(s.id)).length
  const totalToday = todaySupplements.length

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Suplementación</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Registrá tu consumo diario.
          </p>
        </div>
        <Link
          href="/supplements/new"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Agregar
        </Link>
      </div>

      {/* Checklist de hoy */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Hoy</h2>
          {totalToday > 0 && (
            <span className="text-sm text-muted-foreground">
              {takenCount}/{totalToday} tomados
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {totalToday > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(takenCount / totalToday) * 100}%` }}
            />
          </div>
        )}

        <Card className="p-3">
          <SupplementChecklist
            supplements={todaySupplements}
            takenIds={takenIds}
            logDate={today}
          />
        </Card>
      </section>

      {/* Acceso al calendario */}
      <Link href="/supplements/calendar">
        <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary/50">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Calendario de adherencia</span>
            <span className="text-sm text-muted-foreground">
              Ver tu constancia mensual
            </span>
          </div>
        </Card>
      </Link>

      {/* Lista de suplementos activos */}
      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Mis suplementos ({active.length})
          </h2>
          <div className="flex flex-col gap-2">
            {active.map((s) => (
              <SupplementListItem key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {/* Inactivos */}
      {inactive.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Inactivos ({inactive.length})
          </h2>
          <div className="flex flex-col gap-2 opacity-60">
            {inactive.map((s) => (
              <SupplementListItem key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {allSupplements.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <FlaskConical className="size-10 text-muted-foreground/40" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">No tenés suplementos</p>
            <p className="text-sm text-muted-foreground">
              Agregá tus primeros suplementos para empezar a registrar tu adherencia.
            </p>
          </div>
          <Link
            href="/supplements/new"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Agregar suplemento
          </Link>
        </Card>
      )}
    </div>
  )
}
