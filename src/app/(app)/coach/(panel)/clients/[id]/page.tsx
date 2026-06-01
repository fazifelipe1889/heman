import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { MessageCircle } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getSubscriptionDetail, listMessages } from "@/lib/db/coaching"
import { readPerks, isPerkEnabled } from "@/lib/domain/coaching"
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/domain/labels"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CoachNotesForm } from "@/features/coach/coach-notes-form"
import { ChatPanel } from "@/features/coaching/chat-panel"

export const metadata: Metadata = { title: "Cliente — EPHA" }

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default async function CoachClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, coach } = await requireCoach()

  const sub = await getSubscriptionDetail(supabase, id)
  if (!sub || sub.coach_id !== coach.id) notFound()

  const perks = readPerks(sub.perks_snapshot)
  const chatEnabled = isPerkEnabled(perks, "chat") && sub.status === "active"
  const messages = chatEnabled ? await listMessages(supabase, sub.id) : []
  const perkList = [
    isPerkEnabled(perks, "chat") && "Chat",
    perks.video_calls.count > 0 && `${perks.video_calls.count} videollamadas`,
    isPerkEnabled(perks, "routine") && "Rutina personalizada",
    isPerkEnabled(perks, "supplements") && "Suplementación",
    isPerkEnabled(perks, "progress_sharing") && "Seguimiento de progreso",
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/clients"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Clientes
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">{sub.program.title}</h1>
          <Badge variant={sub.status === "active" ? "default" : "secondary"}>
            {SUBSCRIPTION_STATUS_LABELS[sub.status]}
          </Badge>
        </div>
      </div>

      {/* Datos de la suscripción */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{sub.plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inicio</span>
            <span className="font-medium">{fmtDate(sub.starts_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vencimiento</span>
            <span className="font-medium">{fmtDate(sub.ends_at)}</span>
          </div>
          {perkList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t pt-3">
              {perkList.map((p) => (
                <Badge key={p} variant="secondary" className="text-[11px]">
                  {p}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat con el cliente */}
      {chatEnabled && (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="size-4" /> Chat
          </h2>
          <ChatPanel
            subscriptionId={sub.id}
            currentUserId={coach.id}
            initialMessages={messages}
            enabled={chatEnabled}
          />
        </div>
      )}

      {/* Notas privadas */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Notas privadas</h2>
        <CoachNotesForm subscriptionId={sub.id} initialNotes={sub.coach_notes ?? ""} />
      </div>
    </div>
  )
}
