import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { listMarketplaceCoaches } from "@/lib/db/coaching"
import { CoachCard } from "@/features/coaching/coach-card"

export const metadata: Metadata = {
  title: "Asesorías y planes — EPHA",
  description: "Encontrá tu coach y entrená con un plan profesional a medida.",
}

export default async function MarketplacePage() {
  const supabase = await createClient()
  const coaches = await listMarketplaceCoaches(supabase)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Asesorías y planes</h1>
        <p className="text-sm text-muted-foreground">
          Elegí tu coach y mirá sus asesorías y planes.
        </p>
      </div>

      {coaches.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay coaches disponibles por ahora.
        </p>
      ) : (
        <div className="grid gap-4">
          {coaches.map((c) => (
            <CoachCard key={c.id} coach={c} />
          ))}
        </div>
      )}
    </div>
  )
}
