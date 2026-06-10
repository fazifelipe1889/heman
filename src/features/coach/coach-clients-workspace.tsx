"use client"

import * as React from "react"
import Link from "next/link"
import { Search, ArrowUpRight } from "lucide-react"

import type { CoachClientWithUser } from "@/lib/db/coaching"
import type { SubscriptionStatus } from "@/lib/domain/coaching"
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/domain/labels"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import { CoachNotesForm } from "./coach-notes-form"

const STATUS_VARIANT: Record<SubscriptionStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pending: "secondary",
  paused: "secondary",
  expired: "outline",
  cancelled: "outline",
  refunded: "outline",
}

const FINALIZED: SubscriptionStatus[] = ["expired", "cancelled", "refunded"]

type StatusFilter = "todos" | "activos" | "finalizados"
const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "finalizados", label: "Finalizados" },
]

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * Workspace desktop de "Clientes": lista filtrable (búsqueda + producto +
 * estado) a la izquierda, ficha del cliente seleccionado a la derecha. La ficha
 * completa (chat, progreso…) sigue viviendo en /coach/clients/[id].
 */
export function CoachClientsWorkspace({
  clients,
  initialProgramId,
}: {
  clients: CoachClientWithUser[]
  initialProgramId: string | null
}) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("todos")
  const [programFilter, setProgramFilter] = React.useState<string>(
    initialProgramId ?? "all",
  )
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const programs = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const c of clients) m.set(c.program.id, c.program.title)
    return [...m.entries()].map(([id, title]) => ({ id, title }))
  }, [clients])

  const filtered = React.useMemo(() => {
    let r = [...clients]
    if (programFilter !== "all") r = r.filter((c) => c.program.id === programFilter)
    if (statusFilter === "activos") r = r.filter((c) => c.status === "active")
    else if (statusFilter === "finalizados")
      r = r.filter((c) => FINALIZED.includes(c.status))
    const q = search.trim().toLowerCase()
    if (q) {
      r = r.filter(
        (c) =>
          (c.user?.full_name ?? "").toLowerCase().includes(q) ||
          c.plan.name.toLowerCase().includes(q),
      )
    }
    return r
  }, [clients, programFilter, statusFilter, search])

  const selected =
    filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null

  return (
    <div className="grid grid-cols-[20rem_1fr] gap-4 xl:grid-cols-[22rem_1fr]">
      {/* Lista + filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {programs.length > 1 && (
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos los productos</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors",
                statusFilter === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              Sin resultados.
            </p>
          ) : (
            filtered.map((c) => {
              const name = c.user?.full_name?.trim() || "Cliente sin nombre"
              const active = c.id === selected?.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {c.plan.name} · vence {fmtDate(c.ends_at)}
                    </span>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[c.status]}
                    className="shrink-0 text-[10px]"
                  >
                    {SUBSCRIPTION_STATUS_LABELS[c.status]}
                  </Badge>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Ficha */}
      <div>{selected ? <ClientFicha client={selected} /> : null}</div>
    </div>
  )
}

function ClientFicha({ client }: { client: CoachClientWithUser }) {
  const name = client.user?.full_name?.trim() || "Cliente sin nombre"
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="truncate text-lg font-semibold tracking-tight">{name}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {client.program.title} · {client.plan.name}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[client.status]}>
            {SUBSCRIPTION_STATUS_LABELS[client.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border p-3 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Cliente desde</span>
            <span className="font-medium">{fmtDate(client.created_at)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Vence</span>
            <span className="font-medium">{fmtDate(client.ends_at)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Notas privadas</span>
          {/* key: remonta el form al cambiar de cliente para resetear el estado */}
          <CoachNotesForm
            key={client.id}
            subscriptionId={client.id}
            initialNotes={client.coach_notes ?? ""}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Link
            href={`/coach/clients/${client.id}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <ArrowUpRight className="size-4" /> Abrir ficha completa
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
