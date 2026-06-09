import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Plus, Eye } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  listCoachPrograms,
  listCoachClients,
  getCoachEarnings,
} from "@/lib/db/coaching"
import { formatMoney } from "@/lib/domain/coaching"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShareLinkButton } from "@/features/coach/share-link-button"

export const metadata: Metadata = { title: "Panel de coach — EPHA" }

export default async function CoachHomePage() {
  const { supabase, coach } = await requireCoach()

  const [programs, activeClients, earnings] = await Promise.all([
    listCoachPrograms(supabase, coach.id),
    listCoachClients(supabase, coach.id, { status: "active" }),
    getCoachEarnings(supabase, coach.id),
  ])

  const published = programs.filter((p) => p.status === "published").length

  const stats = [
    { label: "Clientes activos", value: String(activeClients.length) },
    { label: "Asesorías publicadas", value: String(published) },
    { label: "Ingresos netos", value: formatMoney(earnings.netCents) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {coach.display_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">@{coach.handle}</p>
        </div>
        {coach.rating_count > 0 && (
          <Badge variant="secondary">
            ★ {coach.rating_avg.toFixed(1)} ({coach.rating_count})
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardContent className="flex flex-col items-center gap-1 py-3 text-center">
              <span className="text-lg font-bold tracking-tight">{s.value}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {s.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/programs/new"
          className={cn(buttonVariants({ size: "lg" }), "h-12")}
        >
          <Plus className="size-4" /> Crear asesoría
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/c/${coach.handle}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 flex-1",
            )}
          >
            <Eye className="size-4" /> Ver mi perfil
          </Link>
          <ShareLinkButton
            path={`/c/${coach.handle}`}
            label="Compartir perfil"
            shareTitle={`${coach.display_name} — Coach en EPHA`}
            variant="outline"
            size="lg"
            className="h-12 flex-1"
          />
        </div>
      </div>

      {/* Atajos */}
      <div className="grid gap-3">
        {[
          { href: "/coach/programs", title: "Mis asesorías", desc: `${programs.length} en total` },
          { href: "/coach/clients", title: "Clientes", desc: `${activeClients.length} activos` },
          { href: "/coach/earnings", title: "Ingresos", desc: `${earnings.approvedCount} pagos` },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{item.desc}</span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
