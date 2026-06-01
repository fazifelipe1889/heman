import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Flame, HeartPulse, Repeat2 } from "lucide-react"

import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Crear rutina de cardio — EPHA",
}

export default function NewCardioPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/routines"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Rutinas
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Cardio</h1>
          <p className="text-sm text-muted-foreground">
            Elegí el tipo de cardio. El flujo es distinto en cada uno.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/routines/new/cardio/liss">
          <Card className="flex flex-row items-center gap-4 p-4 transition-colors hover:border-primary/50">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <HeartPulse className="size-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold">Cardio Tradicional</p>
              <p className="text-sm text-muted-foreground">
                Actividad continua: caminata, running, bicicleta…
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/routines/new/cardio/hiit">
          <Card className="flex flex-row items-center gap-4 p-4 transition-colors hover:border-primary/50">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
              <Flame className="size-6 text-destructive" />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold">HIIT</p>
              <p className="text-sm text-muted-foreground">
                Intervalos de alta intensidad con trabajo y descanso fijos.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/routines/new/cardio/custom">
          <Card className="flex flex-row items-center gap-4 p-4 transition-colors hover:border-primary/50">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Repeat2 className="size-6 text-foreground" />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold">Intervalos personalizados</p>
              <p className="text-sm text-muted-foreground">
                Secuencia de bloques custom con distintas duraciones e intensidades.
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
