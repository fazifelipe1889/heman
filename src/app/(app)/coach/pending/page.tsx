import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Clock, ArrowLeft } from "lucide-react"

import { getCoachContext } from "@/lib/auth/guards"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { COACH_STATUS_LABELS } from "@/lib/domain/labels"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Solicitud en revisión — EPHA",
}

export default async function CoachPendingPage() {
  const { user, coach } = await getCoachContext()
  if (!user) redirect("/login")
  if (!coach) redirect("/coach/apply")
  if (coach.status === "active") redirect("/coach")

  const rejected = coach.status === "rejected"
  const suspended = coach.status === "suspended"

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Inicio
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">
              {rejected
                ? "Solicitud rechazada"
                : suspended
                  ? "Cuenta suspendida"
                  : "Solicitud en revisión"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {rejected
                ? "Tu solicitud de coach no fue aprobada. Escribinos si creés que es un error."
                : suspended
                  ? "Tu cuenta de coach está suspendida temporalmente."
                  : "Estamos revisando tu perfil de coach. Te avisaremos apenas esté aprobado."}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Estado: {COACH_STATUS_LABELS[coach.status]}
          </div>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
