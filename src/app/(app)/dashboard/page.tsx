import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser, getCachedProfile } from "@/lib/supabase/auth"
import { getQuotePreferences } from "@/lib/db/quote-preferences"
import { getUserActiveSubscription, getCoachProfile } from "@/lib/db/coaching"
import { filterQuotes, type QuoteCategory } from "@/lib/domain/quotes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuoteCard } from "@/features/quotes/quote-card"
import { TourLauncher } from "@/features/onboarding-tour/tour-launcher"

export const metadata: Metadata = {
  title: "Inicio — EPHA",
}

type Section = {
  title: string
  description: string
  href?: string
  /** Identificador para el tour de bienvenida (data-tour="..."). */
  tourId?: string
}

const SECTIONS: Section[] = [
  {
    title: "Entrenar",
    description: "Seguí tu plan o elegí una rutina.",
    href: "/train",
    tourId: "entrenar",
  },
  {
    title: "Suplementación",
    description: "Registrá tu constancia diaria de suplementos.",
    href: "/supplements",
    tourId: "supplements",
  },
  {
    title: "Rutinas",
    description: "Creá y organizá tus rutinas de entrenamiento.",
    href: "/routines",
    tourId: "rutinas",
  },
  {
    title: "Progreso",
    description: "Seguí tu evolución de fuerza y volumen.",
    href: "/progress",
    tourId: "progreso",
  },
  {
    title: "Wiki Gym",
    description: "Biblioteca de entrenamiento y nutrición.",
    href: "/wiki",
    tourId: "wiki",
  },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>
}) {
  const supabase = await createClient()
  const user = await getCachedUser()
  const { tour } = await searchParams

  const [profile, quotePrefs, activeSub, coachProfile] = await Promise.all([
    user ? getCachedProfile(user.id).catch(() => null) : null,
    user ? getQuotePreferences(supabase, user.id).catch(() => null) : null,
    user ? getUserActiveSubscription(supabase, user.id).catch(() => null) : null,
    user ? getCoachProfile(supabase, user.id).catch(() => null) : null,
  ])

  // Precomputar si hay frases disponibles para las categorías activas
  const activeCategories = (quotePrefs?.categories ?? []) as QuoteCategory[]
  const quotesAvailable =
    quotePrefs?.enabled !== false && filterQuotes(activeCategories).length > 0

  // Entradas de coaching según el estado del usuario.
  // El catálogo público se desactivó: los clientes llegan a una asesoría por
  // link directo, así que el dashboard ya no ofrece un CTA al marketplace.
  const coachingSections: Section[] = [
    coachProfile
      ? {
          title: "Panel de coach",
          description: "Gestioná tus asesorías y clientes.",
          href: "/coach",
          tourId: "asesorias",
        }
      : {
          title: "Ser coach",
          description: "Vendé tus asesorías en la plataforma.",
          href: "/coach/apply",
          tourId: "asesorias",
        },
  ]
  const sections = [...SECTIONS, ...coachingSections]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Logo EPHA */}
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <div className="text-5xl font-bold tracking-tighter text-primary">EPHA</div>
        <p className="text-sm text-muted-foreground">Plataforma Fitness</p>
      </div>

      {/* Frase motivacional */}
      {quotesAvailable && (
        <div data-tour="frases">
          <QuoteCard activeCategories={activeCategories} />
        </div>
      )}

      {/* Mi Asesoría (destacado) */}
      {activeSub && (
        <Link href="/coaching/mi-asesoria" className="rounded-xl">
          <Card className="bg-primary/5 ring-primary/30 transition-colors hover:ring-primary/50">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  Mi asesoría
                </span>
                <span className="font-medium">{activeSub.program.title}</span>
                <span className="text-sm text-muted-foreground">
                  con {activeSub.coach.display_name}
                </span>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Secciones */}
      <div className="grid gap-3">
        {sections.map((s) => {
          const inner = (
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 flex-col items-center text-center">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </div>
                {s.href ? (
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <Badge variant="secondary">Próximamente</Badge>
                )}
              </div>
            </CardHeader>
          )

          return s.href ? (
            <Link
              key={s.title}
              href={s.href}
              className="rounded-xl"
              data-tour={s.tourId}
            >
              <Card className="transition-colors hover:border-primary/50">
                {inner}
              </Card>
            </Link>
          ) : (
            <Card key={s.title} className="opacity-90" data-tour={s.tourId}>
              {inner}
            </Card>
          )
        })}
      </div>

      <TourLauncher
        alreadyCompleted={!!profile?.tour_completed_at}
        forceOpen={tour === "1"}
      />
    </div>
  )
}
