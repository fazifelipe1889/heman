import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, BadgeCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProgramLanding } from "@/lib/db/coaching"
import { getInitials } from "@/lib/domain/coaching"
import { COACHING_CATEGORY_LABELS } from "@/lib/domain/labels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlanPurchaseCard } from "@/features/coaching/plan-purchase-card"

type Props = { params: Promise<{ handle: string; slug: string }> }
type FaqItem = { question: string; answer: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params
  const supabase = await createClient()
  const data = await getProgramLanding(supabase, handle, slug)
  if (!data) return { title: "Asesoría — EPHA" }
  return {
    title: `${data.title} — ${data.coach.display_name}`,
    description: data.tagline ?? undefined,
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  })
}

export default async function ProgramLandingPage({ params }: Props) {
  const { handle, slug } = await params
  const supabase = await createClient()

  const data = await getProgramLanding(supabase, handle, slug)
  if (!data || data.status !== "published") notFound()

  const { coach, plans, reviews } = data
  const faq = (data.faq as FaqItem[]) ?? []

  return (
    <div className="flex flex-col">
      {/* Cover */}
      {data.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.cover_url} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-muted" />
      )}

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {COACHING_CATEGORY_LABELS[data.category]}
            </Badge>
            {data.level && (
              <span className="text-xs text-muted-foreground">{data.level}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
          {data.tagline && (
            <p className="text-muted-foreground">{data.tagline}</p>
          )}
        </div>

        {/* Coach */}
        <Link
          href={`/c/${coach.handle}`}
          className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
            {coach.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coach.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              getInitials(coach.display_name)
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1 font-medium">
              {coach.display_name}
              {coach.is_verified && <BadgeCheck className="size-4 text-primary" />}
            </span>
            {coach.headline && (
              <span className="truncate text-xs text-muted-foreground">
                {coach.headline}
              </span>
            )}
          </div>
          {coach.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-primary text-primary" />
              {coach.rating_avg.toFixed(1)}
            </span>
          )}
        </Link>

        {/* Descripción */}
        {data.description && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Sobre la asesoría</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {data.description}
            </p>
          </div>
        )}

        {/* Planes */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Planes</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta asesoría todavía no tiene planes disponibles.
            </p>
          ) : (
            plans.map((plan, i) => (
              <PlanPurchaseCard
                key={plan.id}
                plan={plan}
                handle={coach.handle}
                slug={data.slug}
                highlight={plans.length > 1 && i === 1}
              />
            ))
          )}
        </div>

        {/* FAQ */}
        {faq.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
            {faq.map((item, i) => (
              <Card key={i} size="sm">
                <CardContent className="flex flex-col gap-1 py-3">
                  <span className="text-sm font-medium">{item.question}</span>
                  <span className="text-sm text-muted-foreground">{item.answer}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reseñas */}
        {reviews.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Reseñas</h2>
            {reviews.map((r) => (
              <Card key={r.id} size="sm">
                <CardContent className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < r.rating
                              ? "size-3.5 fill-primary text-primary"
                              : "size-3.5 text-muted"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(r.created_at)}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
