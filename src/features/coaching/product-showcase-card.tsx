"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  formatMoney,
  readIncludes,
  readCategories,
  PRODUCT_TYPES,
} from "@/lib/domain/coaching"
import { COACHING_CATEGORY_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/domain/labels"
import type { MarketplaceProgram } from "@/lib/db/coaching"

export function ProductShowcaseCard({
  program,
  handle,
}: {
  program: MarketplaceProgram
  handle: string
}) {
  const plan = program.plans[0] ?? null
  const includes = readIncludes(program.includes)
  const productType = (PRODUCT_TYPES as readonly string[]).includes(
    program.product_type
  )
    ? program.product_type
    : "asesoria"
  const checkoutHref = plan
    ? `/c/${handle}/${program.slug}/checkout?plan=${plan.id}`
    : `/c/${handle}/${program.slug}`

  return (
    <Card className="flex h-full w-72 flex-col overflow-hidden">
      {program.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={program.cover_url}
          alt={program.title}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="h-36 w-full bg-gradient-to-br from-primary/20 to-muted" />
      )}

      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[11px]">
            {PRODUCT_TYPE_LABELS[productType]}
          </Badge>
          {readCategories(program.category).map((cat) => (
            <span key={cat} className="text-xs text-muted-foreground">
              {COACHING_CATEGORY_LABELS[cat]}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-bold uppercase leading-tight tracking-tight">
            {program.title}
          </h3>
          {program.tagline && (
            <p className="text-sm font-medium text-muted-foreground">
              {program.tagline}
            </p>
          )}
        </div>

        {program.short_description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {program.short_description}
          </p>
        )}

        {includes.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {includes.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Precio + duración */}
        {plan && (
          <PriceBlock plan={plan} />
        )}

        <div className="flex flex-col gap-2">
          {/* Ver detalle → descripción larga */}
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Ver detalle <ArrowRight className="size-4" />
                </Button>
              }
            />
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{program.title}</DialogTitle>
              </DialogHeader>
              {program.tagline && (
                <p className="text-sm font-medium text-muted-foreground">
                  {program.tagline}
                </p>
              )}
              {program.description && (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {program.description}
                </p>
              )}
              {includes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={checkoutHref} className={cn(buttonVariants(), "w-full")}>
                {plan ? "Contratar" : "Ver"}
              </Link>
            </DialogContent>
          </Dialog>

          <Link
            href={checkoutHref}
            className={cn(buttonVariants(), "w-full")}
          >
            {plan ? "Contratar" : "Ver"}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function PriceBlock({ plan }: { plan: import("@/lib/supabase/types").CoachingPlan }) {
  const discountPct: number = (plan as { discount_pct?: number }).discount_pct ?? 0
  const accentColor: string | null = (plan as { accent_color?: string | null }).accent_color ?? null
  const discountedCents =
    discountPct > 0 ? Math.round(plan.price_cents * (1 - discountPct / 100)) : null

  return (
    <div
      className="mt-auto rounded-lg border p-3 transition-colors"
      style={
        accentColor
          ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}60` }
          : undefined
      }
    >
      <span
        className="text-[11px] uppercase tracking-wide"
        style={accentColor ? { color: accentColor } : { color: "var(--muted-foreground)" }}
      >
        Precio
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tracking-tight">
          {formatMoney(discountedCents ?? plan.price_cents, plan.currency)}
        </span>
        {discountedCents != null && (
          <span className="text-sm text-muted-foreground line-through">
            {formatMoney(plan.price_cents, plan.currency)}
          </span>
        )}
        {plan.price_usd_cents != null && (
          <span className="text-xs text-muted-foreground">
            / {formatMoney(plan.price_usd_cents, "USD")}
          </span>
        )}
      </div>
      {discountPct > 0 && (
        <span
          className="text-xs font-medium"
          style={accentColor ? { color: accentColor } : {}}
        >
          {discountPct}% de descuento
        </span>
      )}
      <span className="block text-xs text-muted-foreground">
        Duración: {plan.duration_days} días
      </span>
    </div>
  )
}
