"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronRight, Search, Users } from "lucide-react"

import type { CoachClientWithUser } from "@/lib/db/coaching"
import type { SubscriptionStatus } from "@/lib/domain/coaching"
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/domain/labels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FilterTab = "todos" | "activos" | "recientes" | "finalizados"

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

const FINALIZED_STATUSES: SubscriptionStatus[] = ["expired", "cancelled", "refunded"]

export function ClientsList({ clients }: { clients: CoachClientWithUser[] }) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<FilterTab>("todos")

  const filtered = useMemo(() => {
    let result = [...clients]

    if (tab === "activos") {
      result = result.filter((c) => c.status === "active")
    } else if (tab === "recientes") {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      result = result.filter((c) => new Date(c.created_at) >= cutoff)
    } else if (tab === "finalizados") {
      result = result.filter((c) => FINALIZED_STATUSES.includes(c.status))
    }

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (c) =>
          (c.user?.full_name ?? "").toLowerCase().includes(q) ||
          c.plan.name.toLowerCase().includes(q)
      )
    }

    return result
  }, [clients, tab, search])

  const isEmpty = clients.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="todos" className="flex-1">Todos</TabsTrigger>
          <TabsTrigger value="activos" className="flex-1">Activos</TabsTrigger>
          <TabsTrigger value="recientes" className="flex-1">Recientes</TabsTrigger>
          <TabsTrigger value="finalizados" className="flex-1">Finalizados</TabsTrigger>
        </TabsList>
      </Tabs>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Esta asesoría todavía no tiene clientes.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? "Sin resultados para tu búsqueda."
                : "No hay clientes en esta categoría."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/coach/clients/${c.id}`} className="rounded-xl">
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium">
                      {c.user?.full_name ?? "Cliente sin nombre"}
                    </span>
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
