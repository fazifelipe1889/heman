import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  BadgeCheck,
  Star,
  MapPin,
  Mail,
  Camera,
  Video,
  Music2,
  Link2,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import {
  getCoachProfileByHandle,
  listMarketplacePrograms,
  listCoachReviews,
  listCoachTransformations,
} from "@/lib/db/coaching"
import { getInitials, readFaq } from "@/lib/domain/coaching"
import type { CoachingReview } from "@/lib/supabase/types"
import { Carousel } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { ProductShowcaseCard } from "@/features/coaching/product-showcase-card"
import { ReviewCard } from "@/features/coaching/review-card"
import { FaqAccordion } from "@/features/coaching/faq-accordion"

type Props = { params: Promise<{ handle: string }> }

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: Camera,
  youtube: Video,
  tiktok: Music2,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const supabase = await createClient()
  const coach = await getCoachProfileByHandle(supabase, handle)
  if (!coach) return { title: "Coach — EPHA" }
  return {
    title: `${coach.display_name} — EPHA`,
    description: coach.headline ?? undefined,
  }
}

export default async function CoachPublicPage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  const coach = await getCoachProfileByHandle(supabase, handle)
  if (!coach || coach.status !== "active") notFound()

  const [programs, reviews, transformations] = await Promise.all([
    listMarketplacePrograms(supabase, { coachId: coach.id }),
    listCoachReviews(supabase, coach.id).catch((): CoachingReview[] => []),
    listCoachTransformations(supabase, coach.id).catch(() => []),
  ])

  const faq = readFaq(coach.faq)
  const socials = (coach.socials ?? {}) as Record<string, string>
  const socialEntries = Object.entries(socials).filter(([, v]) => v)

  return (
    <div className="flex flex-col">
      {/* Portada */}
      {coach.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coach.cover_url} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-24 w-full bg-gradient-to-br from-primary/20 to-muted" />
      )}

      <div className="mx-auto -mt-10 flex w-full max-w-md flex-col gap-8 px-4 pb-12">
        {/* Carta de presentación */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted text-xl font-bold ring-4 ring-background">
            {coach.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coach.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              getInitials(coach.display_name)
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center justify-center gap-1.5 text-xl font-bold tracking-tight">
              {coach.display_name}
              {coach.is_verified && <BadgeCheck className="size-5 text-primary" />}
            </h1>
            <p className="text-sm text-muted-foreground">@{coach.handle}</p>
          </div>
          {coach.headline && <p className="text-sm font-medium">{coach.headline}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {coach.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {coach.location}
              </span>
            )}
            {coach.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {coach.rating_avg.toFixed(1)} · {coach.rating_count} reseñas
              </span>
            )}
          </div>
          {coach.bio && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {coach.bio}
            </p>
          )}
        </div>

        {/* Productos */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Asesorías y planes</h2>
          {programs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Este coach todavía no publicó asesorías ni planes.
            </p>
          ) : (
            <Carousel>
              {programs.map((p) => (
                <ProductShowcaseCard key={p.id} program={p} handle={coach.handle} />
              ))}
            </Carousel>
          )}
        </section>

        {/* Transformaciones */}
        {transformations.length > 0 && (
          <section className="flex flex-col gap-3">
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
                        &ldquo;{t.testimonial}&rdquo;
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {/* Reseñas */}
        {reviews.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Reseñas de clientes</h2>
            <Carousel>
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </Carousel>
          </section>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
            <FaqAccordion items={faq} />
          </section>
        )}

        {/* Contacto */}
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
              {coach.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coach.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                getInitials(coach.display_name)
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">{coach.display_name}</span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Coaching
              </span>
            </div>
          </div>

          {(coach.headline || coach.bio) && (
            <p className="text-sm text-muted-foreground">
              {coach.headline || coach.bio}
            </p>
          )}

          {coach.public_email && (
            <a
              href={`mailto:${coach.public_email}`}
              className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-4" />
              {coach.public_email}
            </a>
          )}

          {socialEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {socialEntries.map(([key, value]) => {
                const Icon = SOCIAL_ICONS[key] ?? Link2
                const href = value.startsWith("http")
                  ? value
                  : `https://${key}.com/${value.replace(/^@/, "")}`
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
