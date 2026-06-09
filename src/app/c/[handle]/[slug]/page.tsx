import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, BadgeCheck, Check, Users, Award } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProgramLanding } from "@/lib/db/coaching"
import {
  getInitials,
  readIncludes,
  getYouTubeEmbedUrl,
  formatMoney,
  readCategories,
} from "@/lib/domain/coaching"
import { COACHING_CATEGORY_LABELS } from "@/lib/domain/labels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProgramPlans } from "@/features/coaching/program-plans"
import { PlansComparisonTable } from "@/features/coaching/plans-comparison-table"

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

  const { coach, plans, reviews, transformations } = data
  const faq = (data.faq as FaqItem[]) ?? []
  const includes = readIncludes(data.includes)
  const embedUrl = getYouTubeEmbedUrl(data.intro_video_url)

  // Plan destacado: el que el coach marcó; si no hay, el del medio (>1) como fallback.
  const featuredIdx = plans.findIndex((p) => p.is_featured)
  const defaultFeatured =
    featuredIdx >= 0 ? featuredIdx : plans.length > 1 ? 1 : undefined

  // Precio "desde" para el CTA fijo.
  const minPriceCents =
    plans.length > 0 ? Math.min(...plans.map((p) => p.price_cents)) : null
  const minPricePlan =
    minPriceCents != null
      ? plans.find((p) => p.price_cents === minPriceCents) ?? null
      : null

  return (
    <div className="flex flex-col">
      {/* Cover */}
      {data.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.cover_url} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-muted" />
      )}

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 pb-28">
        {/* Encabezado */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {readCategories(data.category).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[11px]">
                {COACHING_CATEGORY_LABELS[cat]}
              </Badge>
            ))}
            {data.level && (
              <span className="text-xs text-muted-foreground">{data.level}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
          {data.tagline && (
            <p className="text-muted-foreground">{data.tagline}</p>
          )}
        </div>

        {/* Video intro */}
        {embedUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border">
            <iframe
              src={embedUrl}
              title="Video de presentación"
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

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

        {/* Contadores de credibilidad */}
        {(coach.active_clients > 0 ||
          coach.rating_count > 0 ||
          transformations.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {coach.active_clients > 0 && (
              <div className="flex flex-col items-center gap-0.5 rounded-xl border py-3">
                <Users className="size-4 text-primary" />
                <span className="text-lg font-bold leading-none">
                  {coach.active_clients}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  clientes
                </span>
              </div>
            )}
            {coach.rating_count > 0 && (
              <div className="flex flex-col items-center gap-0.5 rounded-xl border py-3">
                <Star className="size-4 fill-primary text-primary" />
                <span className="text-lg font-bold leading-none">
                  {coach.rating_avg.toFixed(1)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {coach.rating_count} reseñas
                </span>
              </div>
            )}
            {transformations.length > 0 && (
              <div className="flex flex-col items-center gap-0.5 rounded-xl border py-3">
                <Award className="size-4 text-primary" />
                <span className="text-lg font-bold leading-none">
                  {transformations.length}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  transformaciones
                </span>
              </div>
            )}
          </div>
        )}

        {/* Descripción */}
        {data.description && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Sobre la asesoría</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {data.description}
            </p>
          </div>
        )}

        {/* Qué incluye */}
        {includes.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Qué incluye</h2>
            <ul className="flex flex-col gap-2">
              {includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transformaciones (prueba social) */}
        {transformations.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Transformaciones reales</h2>
            {transformations.map((t) => (
              <Card key={t.id} size="sm">
                <CardContent className="flex flex-col gap-3 py-3">
                  {(t.before_url || t.after_url) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        {t.before_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.before_url}
                            alt="Antes"
                            className="aspect-square w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-full rounded-lg bg-muted" />
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium">
                          Antes
                        </span>
                      </div>
                      <div className="relative">
                        {t.after_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.after_url}
                            alt="Después"
                            className="aspect-square w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-full rounded-lg bg-muted" />
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          Después
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{t.client_name}</span>
                      {t.metric && (
                        <span className="text-sm font-semibold text-primary">
                          {t.metric}
                        </span>
                      )}
                    </div>
                    {t.testimonial && (
                      <p className="text-sm text-muted-foreground">
                        “{t.testimonial}”
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabla comparativa */}
        {plans.length > 1 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Comparar planes</h2>
            <PlansComparisonTable plans={plans} />
          </div>
        )}

        {/* Planes */}
        <div id="planes" className="flex scroll-mt-20 flex-col gap-3">
          <h2 className="text-lg font-semibold">Planes</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta asesoría todavía no tiene planes disponibles.
            </p>
          ) : (
            <ProgramPlans
              plans={plans}
              handle={coach.handle}
              slug={data.slug}
              defaultFeatured={defaultFeatured}
            />
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

      {/* CTA fijo */}
      {minPricePlan && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">Desde</span>
              <span className="text-lg font-bold leading-none">
                {formatMoney(minPricePlan.price_cents, minPricePlan.currency)}
                {minPricePlan.price_usd_cents != null && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {formatMoney(minPricePlan.price_usd_cents, "USD")}
                  </span>
                )}
              </span>
            </div>
            <a
              href="#planes"
              className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver planes
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
