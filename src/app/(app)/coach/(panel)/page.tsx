import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Plus, Eye } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  listCoachPrograms,
  listCoachClientsWithUser,
  listCoachPayments,
  getCoachEarnings,
} from "@/lib/db/coaching"
import { formatMoney } from "@/lib/domain/coaching"
import {
  weeklyNetRevenue,
  weeklyNewClients,
  cumulativeClients,
  clientsSince,
} from "@/lib/domain/coach-stats"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShareLinkButton } from "@/features/coach/share-link-button"
import { CreateProductButton } from "@/features/coach/create-product-button"
import {
  WeeklyRevenueChart,
  WeeklyClientsChart,
  ClientGrowthChart,
} from "@/features/coach/coach-charts"

export const metadata: Metadata = { title: "Panel de coach — EPHA" }

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

export default async function CoachHomePage() {
  const { supabase, coach } = await requireCoach()

  const [programs, clients, earnings, payments] = await Promise.all([
    listCoachPrograms(supabase, coach.id),
    listCoachClientsWithUser(supabase, coach.id),
    getCoachEarnings(supabase, coach.id),
    listCoachPayments(supabase, coach.id),
  ])

  const activeClients = clients.filter((c) => c.status === "active")
  const published = programs.filter((p) => p.status === "published").length

  const revenueSeries = weeklyNetRevenue(payments)
  const newClientsSeries = weeklyNewClients(clients)
  const growthSeries = cumulativeClients(clients)

  const newThisWeek = clientsSince(clients, 7)

  const stats = [
    { label: "Clientes activos", value: String(activeClients.length) },
    { label: "Productos publicados", value: String(published) },
    { label: "Ingresos netos", value: formatMoney(earnings.netCents) },
  ]

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Hola, {coach.display_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">@{coach.handle}</p>
        </div>
        <div className="flex items-center gap-2">
          {coach.rating_count > 0 && (
            <Badge variant="secondary">
              ★ {coach.rating_avg.toFixed(1)} ({coach.rating_count})
            </Badge>
          )}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={`/c/${coach.handle}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Eye className="size-4" /> Ver perfil
            </Link>
            <CreateProductButton />
          </div>
        </div>
      </div>

      {/* Stats — KPIs (mobile + desktop, más grandes y alineados a la izq en lg) */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardContent className="flex flex-col items-center gap-1 py-3 text-center lg:items-start lg:py-5 lg:text-left">
              <span className="text-lg font-bold tracking-tight lg:text-3xl">
                {s.value}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground lg:text-sm">
                {s.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos — solo desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        <ChartCard title="Ingresos por semana" subtitle="Neto · últimas 8 semanas">
          <WeeklyRevenueChart data={revenueSeries} />
        </ChartCard>
        <ChartCard title="Clientes nuevos" subtitle="Altas por semana">
          <WeeklyClientsChart data={newClientsSeries} />
        </ChartCard>
        <ChartCard title="Crecimiento" subtitle="Clientes acumulados">
          <ClientGrowthChart data={growthSeries} />
        </ChartCard>
      </div>

      {/* Clientes nuevos esta semana — solo desktop */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes nuevos esta semana</CardTitle>
            <CardDescription>
              {newThisWeek.length === 0
                ? "Sin altas en los últimos 7 días"
                : `${newThisWeek.length} ${newThisWeek.length === 1 ? "alta" : "altas"} en los últimos 7 días`}
            </CardDescription>
          </CardHeader>
          {newThisWeek.length > 0 && (
            <CardContent>
              <ul className="divide-y">
                {newThisWeek.slice(0, 6).map((c) => {
                  const name = c.user?.full_name?.trim() || "Cliente"
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">{name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {c.program.title} · {c.plan.name}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {fmtDate(c.created_at)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Acciones rápidas — solo mobile (en desktop viven en el header/sidebar) */}
      <div className="flex flex-col gap-3 lg:hidden">
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

      {/* Atajos — solo mobile (en desktop están en el sidebar) */}
      <div className="grid gap-3 lg:hidden">
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  )
}
