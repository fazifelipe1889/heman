import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil, Plus, Eye } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  getCoachingProgram,
  listProgramPlans,
  listCoachTransformations,
} from "@/lib/db/coaching"
import {
  COACHING_CATEGORY_LABELS,
  COACHING_PROGRAM_STATUS_LABELS,
} from "@/lib/domain/labels"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProgramStatusControl } from "@/features/coach/program-status-control"
import { PlansList } from "@/features/coach/plans-list"
import { TransformationsList } from "@/features/coach/transformations-list"
import { DeleteProgramButton } from "@/features/coach/delete-program-button"

export const metadata: Metadata = { title: "Editar asesoría — EPHA" }

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, coach } = await requireCoach()

  const program = await getCoachingProgram(supabase, id)
  if (!program || program.coach_id !== coach.id) notFound()

  const plans = await listProgramPlans(supabase, id)
  const visiblePlanCount = plans.filter((p) => p.is_visible).length
  // En este programa solo gestionamos las transformaciones propias de la asesoría.
  // Tolerante a que la migración 0019 aún no esté aplicada (no rompe la gestión de planes).
  let programTransformations: Awaited<
    ReturnType<typeof listCoachTransformations>
  > = []
  try {
    const transformations = await listCoachTransformations(supabase, coach.id)
    programTransformations = transformations.filter((t) => t.program_id === id)
  } catch {
    programTransformations = []
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/programs"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Asesorías
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={program.status === "published" ? "default" : "secondary"}>
                {COACHING_PROGRAM_STATUS_LABELS[program.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {COACHING_CATEGORY_LABELS[program.category]}
              </span>
            </div>
          </div>
          <Link
            href={`/coach/programs/${id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="Editar detalles"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
      </div>

      {/* Estado de publicación */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Estado</span>
            {program.status === "published" && (
              <Link
                href={`/c/${coach.handle}/${program.slug}`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <Eye className="size-4" /> Ver
              </Link>
            )}
          </div>
          <ProgramStatusControl
            programId={id}
            status={program.status}
            visiblePlanCount={visiblePlanCount}
          />
        </CardContent>
      </Card>

      {/* Planes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Planes</h2>
          <Link
            href={`/coach/programs/${id}/plans/new`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="size-4" /> Plan
          </Link>
        </div>
        <PlansList programId={id} plans={plans} />
      </div>

      {/* Transformaciones (prueba social) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Transformaciones</h2>
          <Link
            href={`/coach/programs/${id}/transformations/new`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="size-4" /> Caso
          </Link>
        </div>
        <TransformationsList
          programId={id}
          transformations={programTransformations}
        />
      </div>

      <div className="flex justify-center pt-2">
        <DeleteProgramButton programId={id} />
      </div>
    </div>
  )
}
