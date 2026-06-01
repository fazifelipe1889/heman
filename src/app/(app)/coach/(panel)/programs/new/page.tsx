import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { ProgramForm } from "@/features/coach/program-form"

export const metadata: Metadata = { title: "Nueva asesoría — EPHA" }

export default async function NewProgramPage() {
  await requireCoach()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/programs"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Asesorías
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nueva asesoría</h1>
        <p className="text-sm text-muted-foreground">
          Creá el contenido base. Después agregás los planes y la publicás.
        </p>
      </div>
      <ProgramForm />
    </div>
  )
}
