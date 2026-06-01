import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getCoachingProgram, getCoachTransformation } from "@/lib/db/coaching"
import { TransformationForm } from "@/features/coach/transformation-form"

export const metadata: Metadata = { title: "Editar transformación — EPHA" }

export default async function EditTransformationPage({
  params,
}: {
  params: Promise<{ id: string; transformationId: string }>
}) {
  const { id, transformationId } = await params
  const { supabase, coach } = await requireCoach()

  const [program, transformation] = await Promise.all([
    getCoachingProgram(supabase, id),
    getCoachTransformation(supabase, transformationId),
  ])
  if (!program || program.coach_id !== coach.id) notFound()
  if (!transformation || transformation.coach_id !== coach.id) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href={`/coach/programs/${id}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {program.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar transformación</h1>
      </div>
      <TransformationForm programId={id} transformation={transformation} />
    </div>
  )
}
