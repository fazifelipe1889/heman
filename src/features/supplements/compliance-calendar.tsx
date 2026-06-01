"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { DayCompliance } from "@/lib/domain/supplements"
import { DAY_STATUS_CLASSES } from "@/lib/domain/supplements"

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

type Props = {
  /** Map de dateStr (YYYY-MM-DD) → DayCompliance */
  compliance: Record<string, DayCompliance>
  /** YYYY-MM del mes mostrado */
  month: string
  todayStr: string
}

export function ComplianceCalendar({ compliance, month, todayStr }: Props) {
  const [y, m] = month.split("-").map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)

  // Offset: cuántas celdas vacías antes del día 1 (semana empieza en Lunes)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  // Mes previo y siguiente para navegación
  const prevDate = new Date(y, m - 2, 1)
  const nextDate = new Date(y, m, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`

  // No permitir navegar más allá del mes actual
  const currentMonth = todayStr.slice(0, 7)
  const isNextDisabled = month >= currentMonth

  // Estadísticas del mes
  const monthDays = Object.values(compliance).filter((d) => d.date.startsWith(month))
  const completeDays = monthDays.filter((d) => d.status === "complete").length
  const partialDays = monthDays.filter((d) => d.status === "partial").length
  const missedDays = monthDays.filter((d) => d.status === "missed").length

  return (
    <div className="flex flex-col gap-4">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <Link
          href={`?month=${prevMonth}`}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="font-semibold">
          {MONTH_NAMES[m - 1]} {y}
        </span>
        <Link
          href={isNextDisabled ? "#" : `?month=${nextMonth}`}
          className={`flex size-8 items-center justify-center rounded-lg ${
            isNextDisabled
              ? "pointer-events-none opacity-30"
              : "hover:bg-muted"
          }`}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Encabezado días */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-[10px] font-semibold text-muted-foreground">
            {h}
          </div>
        ))}

        {/* Celdas vacías del inicio */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${month}-${String(day).padStart(2, "0")}`
          const c = compliance[dateStr]
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr
          const statusCls = isFuture || !c ? "" : DAY_STATUS_CLASSES[c.status]

          return (
            <div
              key={day}
              title={
                c && !isFuture
                  ? `${c.taken}/${c.scheduled} suplementos`
                  : undefined
              }
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-colors ${statusCls} ${
                isFuture ? "text-muted-foreground/30" : ""
              } ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 pt-1 text-xs">
        <LegendItem color="bg-emerald-500/80" label="Completo" />
        <LegendItem color="bg-amber-500/80" label="Parcial" />
        <LegendItem color="bg-red-500/80" label="Sin tomar" />
        <LegendItem color="bg-muted/30" label="Sin suplementos" />
      </div>

      {/* Stats del mes */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <StatChip
          value={completeDays}
          label="Completos"
          colorClass="text-emerald-400"
        />
        <StatChip
          value={partialDays}
          label="Parciales"
          colorClass="text-amber-400"
        />
        <StatChip
          value={missedDays}
          label="Perdidos"
          colorClass="text-red-400"
        />
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-3 rounded ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

function StatChip({
  value,
  label,
  colorClass,
}: {
  value: number
  label: string
  colorClass: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/40 py-3">
      <span className={`text-xl font-bold ${colorClass}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
