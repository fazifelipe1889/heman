"use client"

import * as React from "react"
import Link from "next/link"
import { Play, Search, Star } from "lucide-react"

import type { Routine } from "@/lib/supabase/types"
import { ROUTINE_TYPE_META } from "@/features/routines/routine-type"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function RoutineSearch({ routines }: { routines: Routine[] }) {
  const [q, setQ] = React.useState("")
  const [favOnly, setFavOnly] = React.useState(false)

  const filtered = routines.filter(
    (r) =>
      (!favOnly || r.is_favorite) &&
      r.name.toLowerCase().includes(q.trim().toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar rutina…"
            className="h-11 pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={favOnly ? "default" : "outline"}
          size="icon"
          className="size-11 shrink-0"
          aria-label="Solo favoritas"
          onClick={() => setFavOnly((v) => !v)}
        >
          <Star className={favOnly ? "size-5 fill-current" : "size-5"} />
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay rutinas que coincidan.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => {
            const meta = ROUTINE_TYPE_META[r.type]
            const Icon = meta.icon
            return (
              <Link key={r.id} href={`/train/session/${r.id}`}>
                <Card className="flex flex-row items-center gap-3 p-3 transition-colors hover:border-primary/50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{r.name}</span>
                      {r.is_favorite && (
                        <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                      )}
                    </div>
                    <span className="truncate text-sm text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="size-4 fill-current" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
