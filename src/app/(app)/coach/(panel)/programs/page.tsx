import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Dumbbell } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { listCoachPrograms } from "@/lib/db/coaching"
import {
  COACHING_CATEGORY_LABELS,
  COACHING_PROGRAM_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/lib/domain/labels"
import type { CoachingProgramStatus } from "@/lib/domain/coaching"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateProductButton } from "@/features/coach/create-product-button"

export const metadata: Metadata = { title: "Mis productos — EPHA" }

const STATUS_VARIANT: Record<CoachingProgramStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
}

export default async function CoachProgramsPage() {
  const { supabase, coach } = await requireCoach()
  const programs = await listCoachPrograms(supabase, coach.id)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mis productos</h1>
        <CreateProductButton />
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Dumbbell className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Todavía no creaste ningún producto.
            </p>
            <CreateProductButton size="lg" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {programs.map((p) => (
            <Link key={p.id} href={`/coach/programs/${p.id}`} className="rounded-xl">
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {PRODUCT_TYPE_LABELS[p.product_type ?? "asesoria"]}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[p.status]} className="text-[11px]">
                        {COACHING_PROGRAM_STATUS_LABELS[p.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {COACHING_CATEGORY_LABELS[p.category]}
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
