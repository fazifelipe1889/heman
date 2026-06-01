"use client"

import * as React from "react"
import Link from "next/link"
import { ClipboardPlus, Trash2 } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { toast } from "sonner"

import { REVIEW_FIELDS, REVIEW_SECTION_LABELS, type ReviewSection } from "@/lib/domain/progress"
import type { BodyReview, ExerciseE1RMSeries, MuscleTimeSeries } from "@/lib/db/progress"
import { deleteBodyReviewAction } from "./actions"

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------
function shortDate(iso: string) {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

// ---------------------------------------------------------------------------
// PESTAÑA: REVISIONES
// ---------------------------------------------------------------------------
export function ReviewsTab({ reviews }: { reviews: BodyReview[] }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteBodyReviewAction(id)
    setDeletingId(null)
    if (res?.error) toast.error(res.error)
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Todavía no tenés revisiones guardadas.
        </p>
        <Link
          href="/progress/new-review"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <ClipboardPlus className="size-4" /> Añadir primera revisión
        </Link>
      </div>
    )
  }

  // Calcular qué campos tienen ≥2 datos para mostrar gráficas
  const chartableFields = REVIEW_FIELDS.filter((f) => {
    const vals = reviews.filter(
      (r) => (r as Record<string, unknown>)[f.key] != null
    )
    return vals.length >= 2
  })

  // Agrupar campos graficables por sección para organización visual
  const fieldsBySection = new Map<ReviewSection, typeof chartableFields>()
  for (const f of chartableFields) {
    const arr = fieldsBySection.get(f.section) ?? []
    arr.push(f)
    fieldsBySection.set(f.section, arr)
  }

  const chartData = reviews.map((r) => ({
    date: shortDate(r.review_date),
    ...Object.fromEntries(
      REVIEW_FIELDS.map((f) => [
        f.key,
        (r as Record<string, unknown>)[f.key] ?? null,
      ])
    ),
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Botón añadir + lista de revisiones */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {reviews.length} revisión{reviews.length !== 1 ? "es" : ""}
        </h2>
        <Link
          href="/progress/new-review"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ClipboardPlus className="size-3.5" /> Añadir
        </Link>
      </div>

      {/* Cards de revisiones (más reciente primero) */}
      <div className="flex flex-col gap-2">
        {[...reviews].reverse().map((r) => {
          const filled = REVIEW_FIELDS.filter(
            (f) => (r as Record<string, unknown>)[f.key] != null
          )
          return (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{r.review_date}</span>
                <span className="text-xs text-muted-foreground">
                  {filled.length} campo{filled.length !== 1 ? "s" : ""} registrado
                  {filled.length !== 1 ? "s" : ""}
                  {r.weight_kg != null && ` · ${r.weight_kg} kg`}
                  {r.body_fat_pct != null && ` · ${r.body_fat_pct}% grasa`}
                </span>
                {r.notes && (
                  <span className="mt-0.5 text-xs text-muted-foreground/70 truncate max-w-[220px]">
                    {r.notes}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={deletingId === r.id}
                onClick={() => handleDelete(r.id)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Gráficas */}
      {chartableFields.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-base font-semibold">Evolución</h2>

          {Array.from(fieldsBySection.entries()).map(([section, fields]) => (
            <div key={section} className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {REVIEW_SECTION_LABELS[section]}
              </p>
              {fields.map((f) => (
                <div key={f.key} className="rounded-2xl border border-border bg-card px-2 py-4">
                  <p className="mb-3 px-2 text-sm font-semibold">
                    {f.label}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {f.unit}
                    </span>
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 4, right: 12, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: 12,
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(v: unknown) => [`${v} ${f.unit}`, f.label]}
                        labelFormatter={(l) => `Fecha: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey={f.key}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PESTAÑA: EJERCICIOS — 1RM estimado y mejor volumen de serie
// ---------------------------------------------------------------------------
export function ExercisesTab({ series }: { series: ExerciseE1RMSeries[] }) {
  const [selected, setSelected] = React.useState(0)
  const [metric, setMetric]     = React.useState<"e1rm" | "volume">("e1rm")

  if (series.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Completá al menos una sesión de musculación para ver tu progresión.
        </p>
      </div>
    )
  }

  const current    = series[selected]
  const hasTrend   = current.points.length >= 2
  const firstPoint = current.points[0]
  const lastPoint  = current.points.at(-1)!

  const e1rmDiff = hasTrend
    ? Math.round((lastPoint.e1rm - firstPoint.e1rm) * 10) / 10
    : 0
  const volDiff = hasTrend
    ? lastPoint.bestVolume - firstPoint.bestVolume
    : 0

  const chartData   = current.points.map((p) => ({ ...p, dateLabel: shortDate(p.date) }))
  const tickInterval = Math.max(0, Math.floor(chartData.length / 6) - 1)

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de ejercicio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ejercicio
        </label>
        <select
          value={selected}
          onChange={(e) => { setSelected(Number(e.target.value)); setMetric("e1rm") }}
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {series.map((s, i) => (
            <option key={s.exerciseName} value={i}>
              {s.exerciseName} · {s.points.length} {s.points.length === 1 ? "sesión" : "sesiones"}
            </option>
          ))}
        </select>
      </div>

      {/* Gráfica */}
      <div className="rounded-2xl border border-border bg-card px-2 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-sm font-semibold">{current.exerciseName}</p>
          {/* Toggle métrica */}
          <div className="flex rounded-lg bg-muted p-0.5">
            {(["e1rm", "volume"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  metric === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {m === "e1rm" ? "1RM" : "Mejor serie"}
              </button>
            ))}
          </div>
        </div>

        {hasTrend ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: unknown) => [
                    `${v} kg`,
                    metric === "e1rm" ? "1RM estimado" : "Mejor serie (vol)",
                  ]}
                  labelFormatter={(l) => `Fecha: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey={metric === "e1rm" ? "e1rm" : "bestVolume"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="mt-3 flex justify-center gap-6 border-t border-border pt-3 text-center">
              {metric === "e1rm" ? (
                <>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{firstPoint.e1rm} kg</p>
                    <p className="text-xs text-muted-foreground">Primera sesión</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold tabular-nums ${e1rmDiff >= 0 ? "text-primary" : "text-destructive"}`}>
                      {e1rmDiff >= 0 ? "+" : ""}{e1rmDiff} kg
                    </p>
                    <p className="text-xs text-muted-foreground">Variación</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{lastPoint.e1rm} kg</p>
                    <p className="text-xs text-muted-foreground">Última sesión</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{firstPoint.bestVolume} kg</p>
                    <p className="text-xs text-muted-foreground">Primera sesión</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold tabular-nums ${volDiff >= 0 ? "text-primary" : "text-destructive"}`}>
                      {volDiff >= 0 ? "+" : ""}{volDiff} kg
                    </p>
                    <p className="text-xs text-muted-foreground">Variación</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{lastPoint.bestVolume} kg</p>
                    <p className="text-xs text-muted-foreground">Última sesión</p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* Solo 1 sesión — stat card */
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold tabular-nums">{firstPoint.e1rm} kg</p>
                <p className="text-xs text-muted-foreground">1RM estimado</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{firstPoint.bestVolume} kg</p>
                <p className="text-xs text-muted-foreground">Mejor serie</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Completá más sesiones para ver la tendencia.
            </p>
          </div>
        )}
      </div>

      {/* Lista de todos los ejercicios */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Todos los ejercicios
        </p>
        {series.map((s, i) => {
          const first = s.points[0]
          const last  = s.points.at(-1)!
          const diff  = s.points.length >= 2
            ? Math.round((last.e1rm - first.e1rm) * 10) / 10
            : null
          return (
            <button
              key={s.exerciseName}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                i === selected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.exerciseName}</span>
                <span className="text-xs text-muted-foreground">
                  {s.points.length} {s.points.length === 1 ? "sesión" : "sesiones"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold tabular-nums">{last.e1rm} kg</span>
                {diff !== null && (
                  <span className={`text-xs font-semibold tabular-nums ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
                    {diff >= 0 ? "+" : ""}{diff} kg
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PESTAÑA: MÚSCULOS — series y volumen por músculo a lo largo del tiempo
// ---------------------------------------------------------------------------
export function MusclesTab({ muscleTimeSeries }: { muscleTimeSeries: MuscleTimeSeries[] }) {
  const [selectedIdx, setSelectedIdx] = React.useState(0)

  if (muscleTimeSeries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Completá sesiones de musculación con ejercicios del catálogo para ver el análisis por músculo.
        </p>
      </div>
    )
  }

  const current     = muscleTimeSeries[selectedIdx]
  const hasTrend    = current.points.length >= 2
  const totalSets   = current.points.reduce((a, p) => a + p.sets,   0)
  const totalVolume = current.points.reduce((a, p) => a + p.volume, 0)
  const sessions    = current.points.length

  const chartData    = current.points.map((p) => ({ ...p, dateLabel: shortDate(p.date) }))
  const tickInterval = Math.max(0, Math.floor(chartData.length / 6) - 1)

  const maxTotalSets = Math.max(
    ...muscleTimeSeries.map((m) => m.points.reduce((a, p) => a + p.sets, 0))
  )

  const tooltipStyle = {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: 12,
    color: "hsl(var(--foreground))",
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de grupo muscular */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grupo muscular
        </label>
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {muscleTimeSeries.map((m, i) => (
            <option key={m.muscle} value={i}>
              {m.muscle}
            </option>
          ))}
        </select>
      </div>

      {/* Stats de resumen */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sesiones",       value: String(sessions) },
          { label: "Series totales", value: String(totalSets) },
          {
            label: "Volumen total",
            value: totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)} t`
              : `${totalVolume} kg`,
          },
        ].map((s) => (
          <div key={s.label} className="flex flex-col rounded-xl bg-muted/50 px-3 py-3 text-center">
            <span className="text-lg font-bold tabular-nums">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {hasTrend ? (
        <>
          {/* Gráfica: Series por sesión */}
          <div className="rounded-2xl border border-border bg-card px-2 py-4">
            <p className="mb-3 px-2 text-sm font-semibold">
              Series completadas
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">por sesión</span>
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} series`, "Series"]}
                  labelFormatter={(l) => `Fecha: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="sets"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica: Volumen por sesión */}
          <div className="rounded-2xl border border-border bg-card px-2 py-4">
            <p className="mb-3 px-2 text-sm font-semibold">
              Volumen movido
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">kg por sesión</span>
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} kg`, "Volumen"]}
                  labelFormatter={(l) => `Fecha: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--chart-2))", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        /* Solo 1 sesión */
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center">
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-2xl font-bold tabular-nums">{current.points[0].sets}</p>
              <p className="text-xs text-muted-foreground">Series</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{current.points[0].volume} kg</p>
              <p className="text-xs text-muted-foreground">Volumen</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Completá más sesiones para ver la evolución.
          </p>
        </div>
      )}

      {/* Lista de todos los grupos musculares */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Todos los grupos
        </p>
        {muscleTimeSeries.map((m, i) => {
          const tot     = m.points.reduce((a, p) => a + p.sets, 0)
          const widthPct = maxTotalSets > 0 ? (tot / maxTotalSets) * 100 : 0
          return (
            <button
              key={m.muscle}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                i === selectedIdx
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium">{m.muscle}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">{tot} s</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tabs wrapper (manejado con searchParams via URL desde el server, pero
// también controlable con estado local para evitar navegación)
// ---------------------------------------------------------------------------
type Tab = "revisiones" | "ejercicios" | "musculos"

export function ProgressTabs({
  reviews,
  exerciseSeries,
  muscleTimeSeries,
  initialTab,
}: {
  reviews: BodyReview[]
  exerciseSeries: ExerciseE1RMSeries[]
  muscleTimeSeries: MuscleTimeSeries[]
  initialTab: Tab
}) {
  const [tab, setTab] = React.useState<Tab>(initialTab)

  const tabs: { id: Tab; label: string }[] = [
    { id: "revisiones", label: "Revisiones" },
    { id: "ejercicios", label: "Ejercicios" },
    { id: "musculos",   label: "Músculos" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Tab selector */}
      <div className="flex rounded-xl bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "revisiones" && <ReviewsTab reviews={reviews} />}
      {tab === "ejercicios" && <ExercisesTab series={exerciseSeries} />}
      {tab === "musculos"   && <MusclesTab muscleTimeSeries={muscleTimeSeries} />}
    </div>
  )
}
