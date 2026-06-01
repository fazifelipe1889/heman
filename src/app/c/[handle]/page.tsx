import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BadgeCheck, Star } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import {
  getCoachProfileByHandle,
  listMarketplacePrograms,
} from "@/lib/db/coaching"
import { getInitials } from "@/lib/domain/coaching"
import { ProgramCard } from "@/features/coaching/program-card"

type Props = { params: Promise<{ handle: string }> }

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
  if (!coach) notFound()

  const programs = await listMarketplacePrograms(supabase, { coachId: coach.id })

  return (
    <div className="flex flex-col">
      {/* Portada */}
      {coach.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coach.cover_url} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-24 w-full bg-gradient-to-br from-primary/20 to-muted" />
      )}

      <div className="mx-auto -mt-10 flex w-full max-w-md flex-col gap-5 px-4 pb-10">
        {/* Header coach */}
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
          {coach.headline && (
            <p className="text-sm font-medium">{coach.headline}</p>
          )}
          {coach.rating_count > 0 && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-primary text-primary" />
              {coach.rating_avg.toFixed(1)} · {coach.rating_count} reseñas
            </span>
          )}
          {coach.bio && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {coach.bio}
            </p>
          )}
        </div>

        {/* Asesorías */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Asesorías</h2>
          {programs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Este coach todavía no publicó asesorías.
            </p>
          ) : (
            programs.map((p) => <ProgramCard key={p.id} program={p} />)
          )}
        </div>
      </div>
    </div>
  )
}
