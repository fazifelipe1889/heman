"use client"

import * as React from "react"
import Link from "next/link"
import { Pencil, Users, FileText, Eye, ImageIcon } from "lucide-react"

import {
  COACHING_CATEGORY_LABELS,
  COACHING_PROGRAM_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/lib/domain/labels"
import { formatMoney, readPerks, readCategories } from "@/lib/domain/coaching"
import type { CoachingProgramStatus } from "@/lib/domain/coaching"
import type { CoachProductCard } from "@/lib/db/coaching"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgramStatusControl } from "./program-status-control"
import { ProgramShareActions } from "./program-share-actions"

const STATUS_VARIANT: Record<
  CoachingProgramStatus,
  "default" | "secondary" | "outline"
> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
}

/**
 * Workspace desktop de "Productos": master-detail. Lista seleccionable a la
 * izquierda + vista previa de la tarjeta pública y acciones a la derecha.
 * Solo se monta en lg: (el server lo envuelve en `hidden lg:block`).
 */
export function CoachProductsWorkspace({
  products,
  coachHandle,
}: {
  products: CoachProductCard[]
  coachHandle: string
}) {
  const [selectedId, setSelectedId] = React.useState(products[0]?.id ?? null)
  const selected =
    products.find((p) => p.id === selectedId) ?? products[0] ?? null

  if (products.length === 0) return null

  return (
    <div className="grid grid-cols-[18rem_1fr] gap-4 xl:grid-cols-[20rem_1fr]">
      <div className="flex flex-col gap-2">
        {products.map((p) => {
          const active = p.id === selected?.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40",
              )}
            >
              <Thumb url={p.cover_url} title={p.title} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{p.title}</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={STATUS_VARIANT[p.status]} className="text-[10px]">
                    {COACHING_PROGRAM_STATUS_LABELS[p.status]}
                  </Badge>
                  {p.plan && (
                    <span className="truncate text-xs text-muted-foreground">
                      {formatMoney(p.plan.price_cents, p.plan.currency)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div>
        {selected && <ProductDetail product={selected} coachHandle={coachHandle} />}
      </div>
    </div>
  )
}

function ProductDetail({
  product,
  coachHandle,
}: {
  product: CoachProductCard
  coachHandle: string
}) {
  const { plan } = product
  const perks = plan ? readPerks(plan.perks) : null
  const categories = readCategories(product.category)

  const perkLines: string[] = []
  if (perks?.chat.enabled) perkLines.push("Chat")
  if ((perks?.video_calls.count ?? 0) > 0)
    perkLines.push(`${perks!.video_calls.count} videollamadas`)
  if (perks?.routine.enabled) perkLines.push("Rutina")
  if (perks?.supplements.enabled) perkLines.push("Suplementación")
  if (perks?.progress_sharing.enabled) perkLines.push("Progreso")

  const discounted =
    plan && plan.discount_pct > 0
      ? Math.round(plan.price_cents * (1 - plan.discount_pct / 100))
      : null
  const publicPath = `/c/${coachHandle}/${product.slug}`

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-5">
        {/* Vista previa de la tarjeta pública */}
        <div className="overflow-hidden rounded-xl border">
          {product.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.cover_url}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
          <div className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {PRODUCT_TYPE_LABELS[product.product_type ?? "asesoria"]}
              </Badge>
              <Badge variant={STATUS_VARIANT[product.status]}>
                {COACHING_PROGRAM_STATUS_LABELS[product.status]}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{product.title}</h2>
            {product.tagline && (
              <p className="text-sm text-muted-foreground">{product.tagline}</p>
            )}
            {plan && (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {formatMoney(discounted ?? plan.price_cents, plan.currency)}
                </span>
                {discounted != null && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatMoney(plan.price_cents, plan.currency)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  · {plan.duration_days} días
                </span>
              </div>
            )}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {categories.map((c) => (
                  <span key={c} className="text-xs text-muted-foreground">
                    {COACHING_CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>
            )}
            {perkLines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {perkLines.map((l) => (
                  <Badge key={l} variant="secondary" className="text-[11px]">
                    {l}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Publicación */}
        {!plan && (
          <p className="text-sm text-muted-foreground">
            Falta configurar precio y duración. Editá el producto para poder
            publicarlo.
          </p>
        )}
        {product.status === "published" && (
          <ProgramShareActions path={publicPath} />
        )}
        <ProgramStatusControl
          programId={product.id}
          status={product.status}
          visiblePlanCount={product.visiblePlanCount}
        />

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Link
            href={`/coach/programs/${product.id}/edit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Pencil className="size-4" /> Editar
          </Link>
          <Link
            href={`/coach/programs/${product.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FileText className="size-4" /> Ficha completa
          </Link>
          <Link
            href={`/coach/clients?program=${product.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Users className="size-4" /> Clientes
          </Link>
          {product.status === "published" && (
            <a
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Eye className="size-4" /> Ver pública
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Thumb({ url, title }: { url: string | null; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="size-10 shrink-0 rounded-lg object-cover"
      />
    )
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
      {title.charAt(0).toUpperCase()}
    </span>
  )
}
