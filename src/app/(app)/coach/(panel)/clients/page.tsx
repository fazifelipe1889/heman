import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { listCoachClients } from "@/lib/db/coaching"
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/domain/labels"
import type { SubscriptionStatus } from "@/lib/domain/coaching"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "Clientes — EPHA" }

const STATUS_VARIANT: Record<SubscriptionStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pending: "secondary",
  paused: "secondary",
  expired: "outline",
  cancelled: "outline",
  refunded: "outline",
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function CoachClientsPage() {
  const { supabase, coach } = await requireCoach()
  const clients = await listCoachClients(supabase, coach.id)

  // Activos primero.
  const sorted = [...clients].sort((a, b) =>
    a.status === "active" && b.status !== "active" ? -1 : 1
  )

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Todavía no tenés clientes. Cuando alguien compre una asesoría,
              aparecerá acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sorted.map((c) => (
            <Link key={c.id} href={`/coach/clients/${c.id}`} className="rounded-xl">
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium">{c.program.title}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANT[c.status]} className="text-[11px]">
                        {SUBSCRIPTION_STATUS_LABELS[c.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {c.plan.name} · vence {fmtDate(c.ends_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
