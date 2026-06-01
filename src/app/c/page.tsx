import type { Metadata } from "next"
import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { listMarketplacePrograms } from "@/lib/db/coaching"
import {
  COACHING_CATEGORIES,
  type CoachingCategory,
} from "@/lib/domain/coaching"
import { COACHING_CATEGORY_LABELS } from "@/lib/domain/labels"
import { cn } from "@/lib/utils"
import { ProgramCard } from "@/features/coaching/program-card"

export const metadata: Metadata = {
  title: "Asesorías — EPHA",
  description: "Encontrá tu coach y entrená con un plan profesional a medida.",
}

function isValidCategory(v: string | undefined): v is CoachingCategory {
  return !!v && (COACHING_CATEGORIES as readonly string[]).includes(v)
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = isValidCategory(category) ? category : undefined

  const supabase = await createClient()
  const programs = await listMarketplacePrograms(supabase, {
    category: activeCategory,
  })

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Asesorías</h1>
        <p className="text-sm text-muted-foreground">
          Entrená con un coach profesional y un plan hecho para vos.
        </p>
      </div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/c"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !activeCategory
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          Todas
        </Link>
        {COACHING_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/c?category=${c}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {COACHING_CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {programs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay asesorías {activeCategory ? "en esta categoría" : "publicadas"} por
          ahora.
        </p>
      ) : (
        <div className="grid gap-4">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      )}
    </div>
  )
}
