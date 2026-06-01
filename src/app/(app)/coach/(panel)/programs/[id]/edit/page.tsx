import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getCoachingProgram } from "@/lib/db/coaching"
import { ProgramForm } from "@/features/coach/program-form"

export const metadata: Metadata = { title: "Editar detalles — EPHA" }

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, coach } = await requireCoach()

  const program = await getCoachingProgram(supabase, id)
  if (!program || program.coach_id !== coach.id) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href={`/coach/programs/${id}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar detalles</h1>
      </div>
      <ProgramForm program={program} />
    </div>
  )
}
