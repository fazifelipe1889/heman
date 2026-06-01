import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getComplianceRange } from "@/lib/db/supplements"
import { toLocalDateString } from "@/lib/domain/supplements"
import { ComplianceCalendar } from "@/features/supplements/compliance-calendar"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Adherencia — EPHA",
}

export default async function SupplementsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const today = toLocalDateString(new Date())
  const currentMonth = today.slice(0, 7) // YYYY-MM

  // Validar month param
  const monthParam = params.month ?? currentMonth
  const isValidMonth = /^\d{4}-\d{2}$/.test(monthParam)
  const month = isValidMonth ? monthParam : currentMonth

  const [y, m] = month.split("-").map(Number)
  const from = `${month}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, "0")}`

  const supabase = await createClient()
  const complianceMap = await getComplianceRange(supabase, from, to)

  // Serializar Map a Record para el cliente
  const compliance: Record<string, (typeof complianceMap extends Map<string, infer V> ? V : never)> =
    Object.fromEntries(complianceMap)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/supplements"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Adherencia</h1>
      </div>

      <Card className="p-4">
        <ComplianceCalendar
          compliance={compliance}
          month={month}
          todayStr={today}
        />
      </Card>
    </div>
  )
}
