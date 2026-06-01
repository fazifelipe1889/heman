import type { Metadata } from "next"
import Link from "next/link"

import { requireAdmin } from "@/lib/auth/guards"
import { listCoachesByStatus } from "@/lib/db/coaching"
import { getInitials } from "@/lib/domain/coaching"
import { COACH_STATUS_LABELS } from "@/lib/domain/labels"
import type { CoachProfile } from "@/lib/supabase/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CoachModerationActions } from "@/features/admin/coach-moderation"

export const metadata: Metadata = { title: "Admin · Coaches — EPHA" }

function CoachRow({ coach }: { coach: CoachProfile }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
            {coach.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coach.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              getInitials(coach.display_name)
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">{coach.display_name}</span>
            <span className="truncate text-xs text-muted-foreground">
              @{coach.handle}
            </span>
          </div>
          <Badge
            variant={coach.status === "active" ? "default" : "secondary"}
            className="text-[11px]"
          >
            {COACH_STATUS_LABELS[coach.status]}
          </Badge>
        </div>

        {coach.headline && (
          <p className="text-sm text-muted-foreground">{coach.headline}</p>
        )}
        {coach.bio && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{coach.bio}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          {coach.status === "active" ? (
            <Link
              href={`/c/${coach.handle}`}
              className="text-xs text-primary hover:underline"
            >
              Ver perfil público
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Registrado {new Date(coach.created_at).toLocaleDateString("es-AR")}
            </span>
          )}
          <CoachModerationActions coachId={coach.id} status={coach.status} />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminCoachesPage() {
  const { supabase } = await requireAdmin()

  const [pending, active, suspended] = await Promise.all([
    listCoachesByStatus(supabase, "pending_review"),
    listCoachesByStatus(supabase, "active"),
    listCoachesByStatus(supabase, "suspended"),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Coaches</h1>

      {/* Pendientes de revisión */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Pendientes
          {pending.length > 0 && (
            <Badge variant="secondary">{pending.length}</Badge>
          )}
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No hay solicitudes pendientes.
            </CardContent>
          </Card>
        ) : (
          pending.map((c) => <CoachRow key={c.id} coach={c} />)
        )}
      </section>

      {/* Activos */}
      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Activos</h2>
          {active.map((c) => (
            <CoachRow key={c.id} coach={c} />
          ))}
        </section>
      )}

      {/* Suspendidos */}
      {suspended.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Suspendidos</h2>
          {suspended.map((c) => (
            <CoachRow key={c.id} coach={c} />
          ))}
        </section>
      )}
    </div>
  )
}
