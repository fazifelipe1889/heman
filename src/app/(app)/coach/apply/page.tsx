import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { getCoachContext } from "@/lib/auth/guards"
import { CoachProfileForm } from "@/features/coach/coach-profile-form"

export const metadata: Metadata = {
  title: "Ser coach — EPHA",
}

export default async function CoachApplyPage() {
  const { user, coach } = await getCoachContext()
  if (!user) redirect("/login")
  if (coach) redirect(coach.status === "active" ? "/coach" : "/coach/pending")

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Convertite en coach</h1>
        <p className="text-sm text-muted-foreground">
          Creá tu perfil de coach y empezá a vender asesorías. Tu solicitud pasa
          por una revisión rápida del equipo antes de publicarse.
        </p>
      </div>

      <CoachProfileForm />
    </div>
  )
}
