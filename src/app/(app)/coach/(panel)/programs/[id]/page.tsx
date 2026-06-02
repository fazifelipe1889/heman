import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Eye,
  Pencil,
  MessageCircle,
  Video,
  Dumbbell,
  Pill,
  LineChart,
} from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  getCoachProductWithPlan,
  listCoachTransformations,
} from "@/lib/db/coaching"
import {
  COACHING_CATEGORY_LABELS,
  COACHING_PROGRAM_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/lib/domain/labels"
import { formatMoney, readPerks } from "@/lib/domain/coaching"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProgramStatusControl } from "@/features/coach/program-status-control"
import { TransformationsList } from "@/features/coach/transformations-list"
import { DeleteProgramButton } from "@/features/coach/delete-program-button"

export const metadata: Metadata = { title: "Producto — EPHA" }

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, coach } = await requireCoach()

  const product = await getCoachProductWithPlan(supabase, id)
  if (!product || product.program.coach_id !== coach.id) notFound()

  const { program, plan } = product
  const visiblePlanCount = plan && plan.is_visible ? 1 : 0

  const perks = plan ? readPerks(plan.perks) : null
  const perkLines: { icon: React.ElementType; label: string }[] = []
  if (perks?.chat.enabled)
    perkLines.push({ icon: MessageCircle, label: "Chat con el coach" })
  if ((perks?.video_calls.count ?? 0) > 0)
    perkLines.push({
      icon: Video,
      label: `${perks!.video_calls.count} videollamada${perks!.video_calls.count > 1 ? "s" : ""}`,
    })
  if (perks?.routine.enabled)
    perkLines.push({ icon: Dumbbell, label: "Rutina personalizada" })
  if (perks?.supplements.enabled)
    perkLines.push({ icon: Pill, label: "Plan de suplementación" })
  if (perks?.progress_sharing.enabled)
    perkLines.push({ icon: LineChart, label: "Seguimiento de progreso" })

  // Transformaciones del producto. Tolerante a que 0019 no esté aplicada.
  let productTransformations: Awaited<
    ReturnType<typeof listCoachTransformations>
  > = []
  try {
    const transformations = await listCoachTransformations(supabase, coach.id)
    productTransformations = transformations.filter((t) => t.program_id === id)
  } catch {
    productTransformations = []
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/programs"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Mis productos
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {PRODUCT_TYPE_LABELS[program.product_type ?? "asesoria"]}
              </Badge>
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
            aria-label="Editar producto"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
      </div>

      {/* Resumen del producto */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Resumen</span>
            <Link
              href={`/coach/programs/${id}/edit`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Pencil className="size-4" /> Editar
            </Link>
          </div>
          {plan ? (
            <>
              <span className="text-sm text-muted-foreground">
                {formatMoney(plan.price_cents, plan.currency)}
                {plan.price_usd_cents != null && (
                  <> · {formatMoney(plan.price_usd_cents, "USD")}</>
                )}{" "}
                · {plan.duration_days} días
              </span>
              {perkLines.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {perkLines.map((l) => (
                    <Badge key={l.label} variant="secondary" className="text-[11px]">
                      {l.label}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Falta configurar precio y duración. Tocá “Editar”.
            </span>
          )}
        </CardContent>
      </Card>

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
          transformations={productTransformations}
        />
      </div>

      <div className="flex justify-center pt-2">
        <DeleteProgramButton programId={id} />
      </div>
    </div>
  )
}
