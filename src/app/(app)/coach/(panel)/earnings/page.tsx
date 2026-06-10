import type { Metadata } from "next"
import { Wallet } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import {
  getCoachEarnings,
  listCoachPayments,
  listCoachPrograms,
} from "@/lib/db/coaching"
import { formatMoney } from "@/lib/domain/coaching"
import { monthlyNetRevenue, revenueByProduct } from "@/lib/domain/coach-stats"
import { PAYMENT_STATUS_LABELS } from "@/lib/domain/labels"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MonthlyRevenueChart, ProductRevenueDonut } from "@/features/coach/coach-charts"

export const metadata: Metadata = { title: "Ingresos — EPHA" }

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  })
}

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export default async function CoachEarningsPage() {
  const { supabase, coach } = await requireCoach()
  const [earnings, payments, programs] = await Promise.all([
    getCoachEarnings(supabase, coach.id),
    listCoachPayments(supabase, coach.id),
    listCoachPrograms(supabase, coach.id),
  ])

  const monthNet = payments
    .filter((p) => p.status === "approved" && isSameMonth(p.created_at, new Date()))
    .reduce((s, p) => s + p.net_cents, 0)

  const titleById = new Map(programs.map((p) => [p.id, p.title]))
  const monthlySeries = monthlyNetRevenue(payments)
  const productSlices = revenueByProduct(payments, titleById)

  const kpis = [
    { label: "Neto acumulado", value: formatMoney(earnings.netCents) },
    { label: "Neto del mes", value: formatMoney(monthNet) },
    { label: "Facturado bruto", value: formatMoney(earnings.grossCents) },
    { label: "Pagos aprobados", value: String(earnings.approvedCount) },
  ]

  return (
    <div className="flex flex-col gap-5 lg:gap-8">
      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Ingresos</h1>

      {/* KPIs — solo desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} size="sm">
            <CardContent className="flex flex-col gap-1 py-5">
              <span className="text-2xl font-bold tracking-tight">{k.value}</span>
              <span className="text-sm text-muted-foreground">{k.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos — solo desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">Ingreso neto por mes</CardTitle>
            <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <MonthlyRevenueChart data={monthlySeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">Por producto</CardTitle>
            <CardDescription className="text-xs">Participación del neto</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <ProductRevenueDonut data={productSlices} />
          </CardContent>
        </Card>
      </div>

      {/* Resumen — solo mobile (en desktop lo cubren los KPIs) */}
      <Card className="lg:hidden">
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Neto acumulado</span>
              <span className="text-2xl font-bold tracking-tight">
                {formatMoney(earnings.netCents)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Facturado bruto</span>
              <span className="font-semibold">{formatMoney(earnings.grossCents)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Comisión plataforma</span>
              <span className="font-semibold">{formatMoney(earnings.commissionCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Movimientos</h2>
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Todavía no hay pagos registrados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {payments.map((p) => (
              <Card key={p.id} size="sm">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium tabular-nums">
                      {formatMoney(p.net_cents, p.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(p.created_at)} · bruto {formatMoney(p.amount_cents, p.currency)}
                    </span>
                  </div>
                  <Badge
                    variant={p.status === "approved" ? "default" : "secondary"}
                    className="text-[11px]"
                  >
                    {PAYMENT_STATUS_LABELS[p.status]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
