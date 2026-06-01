import type { Metadata } from "next"
import { Wallet } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getCoachEarnings, listCoachPayments } from "@/lib/db/coaching"
import { formatMoney } from "@/lib/domain/coaching"
import { PAYMENT_STATUS_LABELS } from "@/lib/domain/labels"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "Ingresos — EPHA" }

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  })
}

export default async function CoachEarningsPage() {
  const { supabase, coach } = await requireCoach()
  const [earnings, payments] = await Promise.all([
    getCoachEarnings(supabase, coach.id),
    listCoachPayments(supabase, coach.id),
  ])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>

      {/* Resumen */}
      <Card>
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
          <div className="grid gap-2">
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
