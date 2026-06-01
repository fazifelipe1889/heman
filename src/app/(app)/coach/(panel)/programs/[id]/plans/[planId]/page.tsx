import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getCoachingProgram, getCoachingPlan } from "@/lib/db/coaching"
import { PlanForm } from "@/features/coach/plan-form"

export const metadata: Metadata = { title: "Editar plan — EPHA" }

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>
}) {
  const { id, planId } = await params
  const { supabase, coach } = await requireCoach()

  const [program, plan] = await Promise.all([
    getCoachingProgram(supabase, id),
    getCoachingPlan(supabase, planId),
  ])
  if (!program || program.coach_id !== coach.id) notFound()
  if (!plan || plan.program_id !== id) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href={`/coach/programs/${id}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {program.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar plan</h1>
      </div>
      <PlanForm programId={id} plan={plan} />
    </div>
  )
}
