import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, MessageCircle, Star } from "lucide-react"

import { requireUser } from "@/lib/auth/guards"
import {
  getUserActiveSubscription,
  listUserSubscriptions,
  listMessages,
  getSubscriptionReview,
} from "@/lib/db/coaching"
import { readPerks, isPerkEnabled, getInitials } from "@/lib/domain/coaching"
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/domain/labels"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ChatPanel } from "@/features/coaching/chat-panel"
import { ReviewForm } from "@/features/coaching/review-form"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Mi asesoría — EPHA" }

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export default async function MiAsesoriaPage() {
  const { supabase, user } = await requireUser()
  const active = await getUserActiveSubscription(supabase, user.id)

  // -------------------------------------------------------------------------
  // Sin asesoría activa: mostrar historial + reseña, o estado vacío.
  // -------------------------------------------------------------------------
  if (!active) {
    const history = await listUserSubscriptions(supabase, user.id)
    const reviewable = history.find(
      (s) => s.status === "expired" || s.status === "cancelled"
    )
    const existingReview = reviewable
      ? await getSubscriptionReview(supabase, reviewable.id)
      : null

    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Mi asesoría</h1>

        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no contrataste ninguna asesoría.
              </p>
              <Link href="/c" className={buttonVariants()}>
                Explorar asesorías
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {reviewable && !existingReview && (
              <Card>
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">¿Cómo fue tu experiencia?</span>
                    <span className="text-sm text-muted-foreground">
                      Reseñá tu asesoría con {reviewable.coach.display_name}.
                    </span>
                  </div>
                  <ReviewForm subscriptionId={reviewable.id} />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Historial</h2>
              {history.map((s) => (
                <Card key={s.id} size="sm">
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{s.program.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.coach.display_name} · {s.plan.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {SUBSCRIPTION_STATUS_LABELS[s.status]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Link
              href="/c"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Explorar más asesorías
            </Link>
          </>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Con asesoría activa.
  // -------------------------------------------------------------------------
  const perks = readPerks(active.perks_snapshot)
  const chatEnabled = isPerkEnabled(perks, "chat")
  const remaining = daysLeft(active.ends_at)

  const messages = chatEnabled ? await listMessages(supabase, active.id) : []

  const perkList = [
    chatEnabled && "Chat con el coach",
    perks.video_calls.count > 0 && `${perks.video_calls.count} videollamadas`,
    isPerkEnabled(perks, "routine") && "Rutina personalizada",
    isPerkEnabled(perks, "supplements") && "Plan de suplementación",
    isPerkEnabled(perks, "progress_sharing") && "Seguimiento de progreso",
  ].filter(Boolean) as string[]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Inicio
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Mi asesoría</h1>
        {remaining !== null && (
          <p className="text-sm text-muted-foreground">
            {remaining > 0 ? `${remaining} días restantes` : "Finaliza hoy"}
          </p>
        )}
      </div>

      {/* Coach + programa */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <Link href={`/c/${active.coach.handle}`} className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
              {active.coach.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.coach.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                getInitials(active.coach.display_name)
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1 font-medium">
                {active.coach.display_name}
                <BadgeCheck className="size-4 text-primary" />
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {active.program.title} · {active.plan.name}
              </span>
            </div>
          </Link>

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

      {/* Chat */}
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="size-5" /> Chat
        </h2>
        {chatEnabled ? (
          <ChatPanel
            subscriptionId={active.id}
            currentUserId={user.id}
            initialMessages={messages}
            enabled={chatEnabled}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Star className="size-4" />
              Este plan no incluye chat con el coach.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
