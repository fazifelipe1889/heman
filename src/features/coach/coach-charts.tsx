"use client"

/**
 * Gráficos del panel del coach (Recharts). Aislados en un único módulo client.
 * Los colores salen de las CSS vars del tema (oklch) vía `var(--…)`, así que
 * respetan dark mode automáticamente. Las series las calcula el server con los
 * helpers de `@/lib/domain/coach-stats` y se pasan ya agregadas.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMoney } from "@/lib/domain/coaching"
import type {
  WeeklyRevenuePoint,
  WeeklyClientsPoint,
  ClientGrowthPoint,
  MonthlyRevenuePoint,
  ProductRevenueSlice,
} from "@/lib/domain/coach-stats"

const AXIS = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const

const GRID = { stroke: "var(--border)", strokeDasharray: "3 3" } as const

const TOOLTIP = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--card-foreground)",
    boxShadow: "0 4px 16px rgb(0 0 0 / 0.18)",
  },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 2 },
  itemStyle: { color: "var(--card-foreground)" },
} as const

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
]

/** Tick abreviado de dinero (centavos → "12k" / "850"). */
function moneyTick(cents: number): string {
  const u = cents / 100
  if (Math.abs(u) >= 1000) return `${Math.round(u / 1000)}k`
  return String(Math.round(u))
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function WeeklyRevenueChart({ data }: { data: WeeklyRevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="coachRevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={36} tickFormatter={moneyTick} />
        <Tooltip
          {...TOOLTIP}
          formatter={(value) => [formatMoney(Number(value)), "Neto"] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="net"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#coachRevFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function WeeklyClientsChart({ data }: { data: WeeklyClientsPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={28} allowDecimals={false} />
        <Tooltip
          {...TOOLTIP}
          cursor={{ fill: "var(--muted-foreground)", fillOpacity: 0.1 }}
          formatter={(value) => [String(value), "Nuevos"] as [string, string]}
        />
        <Bar dataKey="nuevos" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ClientGrowthChart({ data }: { data: ClientGrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={28} allowDecimals={false} />
        <Tooltip
          {...TOOLTIP}
          formatter={(value) => [String(value), "Activos"] as [string, string]}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "var(--primary)" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Ingresos
// ---------------------------------------------------------------------------

export function MonthlyRevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={40} tickFormatter={moneyTick} />
        <Tooltip
          {...TOOLTIP}
          cursor={{ fill: "var(--muted-foreground)", fillOpacity: 0.1 }}
          formatter={(value) => [formatMoney(Number(value)), "Neto"] as [string, string]}
        />
        <Bar dataKey="net" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ProductRevenueDonut({ data }: { data: ProductRevenueSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Sin ventas registradas todavía.
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Tooltip
            {...TOOLTIP}
            formatter={(value, name) =>
              [formatMoney(Number(value)), String(name)] as [string, string]
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={85}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((slice, i) => (
              <Cell key={slice.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-1.5">
        {data.map((slice, i) => (
          <li key={slice.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {slice.name}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatMoney(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
