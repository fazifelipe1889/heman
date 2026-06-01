import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import {
  getCoachProfileByHandle,
  getCoachingPlan,
  getCoachingProgram,
} from "@/lib/db/coaching"
import { formatMoney, readPerks, isPerkEnabled } from "@/lib/domain/coaching"
import { Card, CardContent } from "@/components/ui/card"
import { CheckoutConfirm } from "@/features/coaching/checkout-confirm"

export const metadata: Metadata = { title: "Checkout — EPHA" }

type Props = {
  params: Promise<{ handle: string; slug: string }>
  searchParams: Promise<{ plan?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { handle, slug } = await params
  const { plan: planId } = await searchParams
  if (!planId) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/c/${handle}/${slug}/checkout?plan=${planId}`)
  }

  const [coach, plan] = await Promise.all([
    getCoachProfileByHandle(supabase, handle),
    getCoachingPlan(supabase, planId),
  ])
  if (!coach || !plan) notFound()

  const program = await getCoachingProgram(supabase, plan.program_id)
  if (!program || program.coach_id !== coach.id) notFound()

  const perks = readPerks(plan.perks)
  const perkList = [
    isPerkEnabled(perks, "chat") && "Chat con el coach",
    perks.video_calls.count > 0 && `${perks.video_calls.count} videollamadas`,
    isPerkEnabled(perks, "routine") && "Rutina personalizada",
    isPerkEnabled(perks, "supplements") && "Plan de suplementación",
    isPerkEnabled(perks, "progress_sharing") && "Seguimiento de progreso",
  ].filter(Boolean) as string[]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href={`/c/${handle}/${slug}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Confirmar contratación</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{program.title}</span>
            <span className="font-semibold">{plan.name}</span>
            <span className="text-sm text-muted-foreground">
              con {coach.display_name}
            </span>
          </div>

          {perkList.length > 0 && (
            <ul className="flex flex-col gap-1 border-t pt-3 text-sm">
              {perkList.map((p) => (
                <li key={p} className="text-muted-foreground">
                  • {p}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Duración</span>
              <span className="font-medium">{plan.duration_days} días</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold tracking-tight">
                {formatMoney(plan.price_cents, plan.currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckoutConfirm planId={plan.id} />
    </div>
  )
}
