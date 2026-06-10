import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight, Users } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  listCoachPrograms,
  getCoachingProgram,
  listCoachClientsForProgram,
  listCoachClientsWithUser,
} from "@/lib/db/coaching"
import { COACHING_PROGRAM_STATUS_LABELS } from "@/lib/domain/labels"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientsList } from "@/features/coach/clients-list"
import { CoachClientsWorkspace } from "@/features/coach/coach-clients-workspace"

export const metadata: Metadata = { title: "Clientes — EPHA" }

export default async function CoachClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>
}) {
  const { program: programId } = await searchParams
  const { supabase, coach } = await requireCoach()

  const [programs, allClients] = await Promise.all([
    listCoachPrograms(supabase, coach.id),
    listCoachClientsWithUser(supabase, coach.id),
  ])

  // Solo en mobile y solo si hay ?program: datos del flujo por asesoría.
  let program: Awaited<ReturnType<typeof getCoachingProgram>> = null
  let programClients: Awaited<ReturnType<typeof listCoachClientsForProgram>> = []
  if (programId) {
    const [pr, cl] = await Promise.all([
      getCoachingProgram(supabase, programId),
      listCoachClientsForProgram(supabase, coach.id, programId),
    ])
    if (!pr || pr.coach_id !== coach.id) notFound()
    program = pr
    programClients = cl
  }

  return (
    <>
      {/* Desktop: lista + ficha de todos los clientes */}
      <div className="hidden lg:block">
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          {allClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Users className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Todavía no tenés clientes en ninguna asesoría.
                </p>
              </CardContent>
            </Card>
          ) : (
            <CoachClientsWorkspace
              clients={allClients}
              initialProgramId={programId ?? null}
            />
          )}
        </div>
      </div>

      {/* Mobile: flujo actual por asesoría (sin cambios) */}
      <div className="lg:hidden">
        {!programId ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Seleccioná una asesoría para ver sus clientes.
              </p>
            </div>

            {programs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Users className="size-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Todavía no creaste ninguna asesoría.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {programs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/coach/clients?program=${p.id}`}
                    className="rounded-xl"
                  >
                    <Card className="transition-colors hover:border-primary/50">
                      <CardContent className="flex items-center justify-between gap-3 py-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate font-medium">{p.title}</span>
                          <Badge
                            variant={p.status === "published" ? "default" : "secondary"}
                            className="w-fit text-[11px]"
                          >
                            {COACHING_PROGRAM_STATUS_LABELS[p.status]}
                          </Badge>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Link
                href="/coach/clients"
                className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Asesorías
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">{program?.title}</h1>
            </div>

            <ClientsList clients={programClients} />
          </div>
        )}
      </div>
    </>
  )
}
