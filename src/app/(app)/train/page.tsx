import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, ChevronRight, Dumbbell, HeartPulse } from "lucide-react"

import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Entrenar — EPHA",
}

export default function TrainPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Entrenar</h1>
        <p className="text-sm text-muted-foreground">¿Qué vas a entrenar hoy?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/train/musculacion"
          className="flex h-40 flex-col justify-between rounded-2xl bg-primary p-4 text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Dumbbell className="size-8" />
          <p className="text-lg font-bold leading-tight">Musculación</p>
        </Link>
        <Link
          href="/train/cardio"
          className="flex h-40 flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-colors active:scale-[0.98] hover:border-primary/50"
        >
          <HeartPulse className="size-8 text-primary" />
          <p className="text-lg font-bold leading-tight">Cardio</p>
        </Link>
      </div>

      <Link href="/plan">
        <Card className="flex flex-row items-center gap-3 p-4 transition-colors hover:border-primary/50">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <CalendarDays className="size-5" />
          </div>
          <div className="flex flex-1 flex-col">
            <p className="font-semibold">Planificar mi semana</p>
            <p className="text-sm text-muted-foreground">
              Asigná rutinas a cada día.
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Card>
      </Link>
    </div>
  )
}
