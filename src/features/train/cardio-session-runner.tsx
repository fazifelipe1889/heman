"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, SkipForward, Trophy } from "lucide-react"
import { toast } from "sonner"

import type { RoutineDetail } from "@/lib/db/routines"
import { INTENSITIES, labelFor } from "@/lib/domain/training"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveCardioSessionAction } from "./cardio-session-actions"
import { DurationCorrectionDialog, isLongWorkout } from "./workout-dialogs"

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Ring de progreso SVG (para LISS)
// ---------------------------------------------------------------------------
function ProgressRing({
  progress,
  size = 220,
  stroke = 6,
  children,
}: {
  progress: number          // 0–1
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const r = (size - stroke * 2) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(progress, 1))

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {/* progress */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pantalla de resumen compartida
// ---------------------------------------------------------------------------
function CardioSummary({
  routineName,
  duration,
  stats,
}: {
  routineName: string
  duration: number
  stats?: { label: string; value: string | number }[]
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Trophy className="size-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">¡Sesión completada!</h1>
        <p className="text-sm text-muted-foreground">{routineName}</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <div className="flex flex-col rounded-xl bg-muted/50 px-3 py-3">
          <span className="font-workout text-xl font-bold tabular-nums">{fmt(duration)}</span>
          <span className="text-xs text-muted-foreground">Duración</span>
        </div>
        {stats?.map((s) => (
          <div key={s.label} className="flex flex-col rounded-xl bg-muted/50 px-3 py-3">
            <span className="font-workout text-xl font-bold tabular-nums">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Link
          href="/train"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
        >
          Volver a Entrenar
        </Link>
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-base font-medium"
        >
          Inicio
        </Link>
      </div>
    </div>
  )
}

// ===========================================================================
// HUD CARDIO TRADICIONAL (LISS) — tranquilo, info-rica, visión de largo plazo
// ===========================================================================
function LissRunner({ routine }: { routine: RoutineDetail }) {
  const liss = routine.liss
  const targetMin = liss?.duration_min ?? null
  const targetSec = targetMin ? targetMin * 60 : null

  const [phase, setPhase] = React.useState<"run" | "done">("run")
  const [elapsed, setElapsed] = React.useState(0)
  const [distanceKm, setDistanceKm] = React.useState<number | undefined>()
  const [calories, setCalories] = React.useState<number | undefined>()
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDuration, setShowDuration] = React.useState(false)
  const startRef = React.useRef(0)

  React.useEffect(() => {
    startRef.current = Date.now()
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    )
    return () => clearInterval(t)
  }, [])

  function handleFinishClick() {
    if (isLongWorkout(elapsed)) {
      setShowDuration(true)
    } else {
      finish(elapsed)
    }
  }

  function finish(durationSeconds: number) {
    setShowDuration(false)
    setIsSaving(true)
    saveCardioSessionAction({
      routineId: routine.id,
      routineType: "cardio_liss",
      name: routine.name,
      durationSeconds,
      distanceKm: distanceKm ?? null,
      calories: calories ?? null,
    }).then((res) => {
      setIsSaving(false)
      if (res?.error) { toast.error(res.error); return }
      setPhase("done")
    })
  }

  if (phase === "done") {
    const stats: { label: string; value: string | number }[] = []
    if (distanceKm != null) stats.push({ label: "km", value: distanceKm })
    if (calories != null) stats.push({ label: "kcal", value: calories })
    return <CardioSummary routineName={routine.name} duration={elapsed} stats={stats} />
  }

  const progress = targetSec ? elapsed / targetSec : 0
  const remaining = targetSec ? Math.max(targetSec - elapsed, 0) : null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header mínimo */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          href="/train"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-sm font-medium truncate max-w-[60%] text-center">
          {routine.name}
        </span>
        <span className="text-sm text-muted-foreground w-6" />
      </div>

      {/* Barra de progreso superior (sutil) */}
      {targetSec && (
        <div className="h-0.5 w-full bg-muted/40">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Timer central — ring o número solo */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5">
        {targetSec ? (
          <ProgressRing progress={progress} size={220} stroke={7}>
            <span className="font-workout text-5xl font-bold tabular-nums tracking-tighter">
              {fmt(elapsed)}
            </span>
            {remaining != null && remaining > 0 && (
              <span className="mt-1 text-xs text-muted-foreground">
                {fmt(remaining)} restante
              </span>
            )}
            {remaining === 0 && (
              <span className="mt-1 text-xs font-semibold text-primary">
                ¡Objetivo alcanzado!
              </span>
            )}
          </ProgressRing>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="font-workout text-7xl font-extrabold tabular-nums tracking-tighter">
              {fmt(elapsed)}
            </span>
            <span className="text-sm text-muted-foreground">transcurrido</span>
          </div>
        )}

        {/* Parámetros de la rutina (configuración) */}
        {(liss?.speed || liss?.incline || liss?.intensity) && (
          <div className="flex flex-wrap justify-center gap-2">
            {liss.speed && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium">
                {liss.speed} km/h
              </span>
            )}
            {liss.incline != null && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium">
                {liss.incline}% inclinación
              </span>
            )}
            {liss.intensity && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium capitalize">
                {labelFor(INTENSITIES, liss.intensity)}
              </span>
            )}
          </div>
        )}

        {/* Tracking manual */}
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registrar
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Distancia (km)
              </label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                placeholder={liss?.distance_km ? String(liss.distance_km) : "0.0"}
                value={distanceKm ?? ""}
                className="h-12 text-center text-lg font-bold font-workout tabular-nums"
                onChange={(e) =>
                  setDistanceKm(
                    e.target.value === "" ? undefined : e.target.valueAsNumber
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Calorías
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={liss?.target_calories ? String(liss.target_calories) : "0"}
                value={calories ?? ""}
                className="h-12 text-center text-lg font-bold font-workout tabular-nums"
                onChange={(e) =>
                  setCalories(
                    e.target.value === "" ? undefined : e.target.valueAsNumber
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-10 pt-4">
        <Button
          type="button"
          size="lg"
          className="h-14 w-full text-base font-semibold"
          disabled={isSaving}
          onClick={handleFinishClick}
        >
          {isSaving ? "Guardando…" : "Finalizar sesión"}
        </Button>
      </div>

      <DurationCorrectionDialog
        open={showDuration}
        elapsedSeconds={elapsed}
        onConfirm={(corrected) => finish(corrected)}
        onSkip={() => finish(elapsed)}
      />
    </div>
  )
}

// ===========================================================================
// HUD HIIT — ultra-minimalista, pantalla llena de color, auto-avance
// ===========================================================================
type HiitPhase = "work" | "rest" | "summary"

function HiitRunner({ routine }: { routine: RoutineDetail }) {
  const hiit = routine.hiit
  const workSec = hiit?.work_seconds ?? 30
  const restSec = hiit?.rest_seconds ?? 10
  const totalRounds = hiit?.rounds ?? 5
  const exerciseName = hiit?.main_exercise ?? null

  const [phase, setPhase] = React.useState<HiitPhase>("work")
  const [countdown, setCountdown] = React.useState(workSec)
  const [round, setRound] = React.useState(1)
  const [elapsed, setElapsed] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDuration, setShowDuration] = React.useState(false)
  const startRef = React.useRef(0)

  // Cronómetro global
  React.useEffect(() => {
    startRef.current = Date.now()
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    )
    return () => clearInterval(t)
  }, [])

  // Tick del countdown
  React.useEffect(() => {
    if (phase === "summary") return
    const t = setTimeout(
      () => setCountdown((c) => (c > 1 ? c - 1 : 0)),
      1000
    )
    return () => clearTimeout(t)
  }, [countdown, phase])

  // Transición de fase al llegar a 0
  React.useEffect(() => {
    if (countdown > 0 || phase === "summary") return
    const capturedPhase = phase
    const capturedRound = round
    const t = setTimeout(() => {
      if (capturedPhase === "work") {
        if (restSec > 0) {
          setPhase("rest")
          setCountdown(restSec)
        } else if (capturedRound >= totalRounds) {
          setPhase("summary")
        } else {
          setRound((r) => r + 1)
          setPhase("work")
          setCountdown(workSec)
        }
      } else if (capturedPhase === "rest") {
        if (capturedRound >= totalRounds) {
          setPhase("summary")
        } else {
          setRound((r) => r + 1)
          setPhase("work")
          setCountdown(workSec)
        }
      }
    }, 50)
    return () => clearTimeout(t)
  }, [countdown, phase, round, restSec, workSec, totalRounds])

  function skip() {
    if (phase === "work") {
      if (restSec > 0) {
        setPhase("rest"); setCountdown(restSec)
      } else if (round >= totalRounds) {
        setPhase("summary")
      } else {
        setRound((r) => r + 1); setPhase("work"); setCountdown(workSec)
      }
    } else if (phase === "rest") {
      if (round >= totalRounds) {
        setPhase("summary")
      } else {
        setRound((r) => r + 1); setPhase("work"); setCountdown(workSec)
      }
    }
  }

  function handleFinishClick() {
    if (isLongWorkout(elapsed)) {
      setShowDuration(true)
    } else {
      finish(elapsed)
    }
  }

  function finish(durationSeconds: number) {
    setShowDuration(false)
    setIsSaving(true)
    saveCardioSessionAction({
      routineId: routine.id,
      routineType: "cardio_hiit",
      name: routine.name,
      durationSeconds,
      roundsCompleted: round,
    }).then((res) => {
      setIsSaving(false)
      if (res?.error) { toast.error(res.error); return }
      setPhase("summary")
    })
  }

  if (phase === "summary") {
    return (
      <CardioSummary
        routineName={routine.name}
        duration={elapsed}
        stats={[{ label: "rondas", value: `${round}/${totalRounds}` }]}
      />
    )
  }

  const isWork = phase === "work"

  return (
    // Fondo de pantalla completa que cambia de color según la fase
    <div
      className={`flex min-h-screen flex-col transition-colors duration-500 ${
        isWork ? "bg-red-950" : "bg-emerald-950"
      }`}
    >
      {/* Header: atrás + cronómetro */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link
          href="/train"
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="font-workout text-sm font-bold tabular-nums text-white/50">{fmt(elapsed)}</span>
      </div>

      {/* Contenido central: todo lo importante */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-8">
        {/* Etiqueta de fase — grande, negrita */}
        <p
          className={`text-3xl font-black tracking-[0.25em] uppercase ${
            isWork ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {isWork ? "Trabajo" : "Descanso"}
        </p>

        {/* Countdown enorme — protagonista total */}
        <p
          className={`font-workout font-extrabold leading-none tabular-nums ${
            isWork ? "text-red-100" : "text-emerald-100"
          }`}
          style={{ fontSize: "clamp(5rem, 22vw, 8rem)" }}
        >
          {fmt(countdown)}
        </p>

        {/* Nombre del ejercicio si aplica */}
        {exerciseName && (
          <p className="text-base font-semibold text-white/60">{exerciseName}</p>
        )}

        {/* Ronda actual */}
        <p className="text-lg font-semibold text-white/70">
          Ronda{" "}
          <span className="font-workout font-extrabold tabular-nums text-white">{round}</span>
          <span className="text-white/40"> / {totalRounds}</span>
        </p>

        {/* Indicadores de ronda (pips) */}
        <div className="flex gap-2 mt-1">
          {Array.from({ length: Math.min(totalRounds, 20) }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < round - 1
                  ? "size-2.5 bg-white/80"
                  : i === round - 1
                    ? `size-3.5 ${isWork ? "bg-red-300" : "bg-emerald-300"}`
                    : "size-2.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 px-5 pb-10">
        <button
          type="button"
          onClick={skip}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-semibold text-white/80 active:bg-white/20"
        >
          <SkipForward className="size-4" />
          Saltar
        </button>
        <button
          type="button"
          onClick={handleFinishClick}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-semibold text-white/80 active:bg-white/20 disabled:opacity-40"
        >
          <CheckCircle2 className="size-4" />
          {isSaving ? "Guardando…" : "Terminar"}
        </button>
      </div>

      <DurationCorrectionDialog
        open={showDuration}
        elapsedSeconds={elapsed}
        onConfirm={(corrected) => finish(corrected)}
        onSkip={() => finish(elapsed)}
      />
    </div>
  )
}

// ===========================================================================
// HUD INTERVALOS PERSONALIZADOS — auto-avance por bloques
// ===========================================================================

/** Detecta si el nombre del bloque sugiere trabajo o descanso */
function blockTheme(name: string): "work" | "rest" | "neutral" {
  const lower = name.toLowerCase()
  if (/trabajo|work|sprint|esfuerzo|activo|alta/.test(lower)) return "work"
  if (/descanso|rest|recupera|pausa|baja/.test(lower)) return "rest"
  return "neutral"
}

function IntervalsRunner({ routine }: { routine: RoutineDetail }) {
  const config = routine.customConfig
  const blocks = routine.blocks
  const totalRounds = config?.rounds ?? 1

  const [blockIdx, setBlockIdx] = React.useState(0)
  const [round, setRound] = React.useState(1)
  const [countdown, setCountdown] = React.useState(
    blocks.length > 0 ? blocks[0].duration_seconds : 0
  )
  const [phase, setPhase] = React.useState<"run" | "done">("run")
  const [elapsed, setElapsed] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDuration, setShowDuration] = React.useState(false)
  const startRef = React.useRef(0)

  React.useEffect(() => {
    startRef.current = Date.now()
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    )
    return () => clearInterval(t)
  }, [])

  // Tick
  React.useEffect(() => {
    if (phase === "done" || blocks.length === 0) return
    const t = setTimeout(
      () => setCountdown((c) => (c > 1 ? c - 1 : 0)),
      1000
    )
    return () => clearTimeout(t)
  }, [countdown, phase, blocks.length])

  // Transición
  React.useEffect(() => {
    if (countdown > 0 || phase === "done" || blocks.length === 0) return
    const capIdx = blockIdx
    const capRound = round
    const t = setTimeout(() => {
      const nextIdx = capIdx + 1
      if (nextIdx < blocks.length) {
        setBlockIdx(nextIdx)
        setCountdown(blocks[nextIdx].duration_seconds)
      } else if (capRound < totalRounds) {
        setRound((r) => r + 1)
        setBlockIdx(0)
        setCountdown(blocks[0].duration_seconds)
      } else {
        setPhase("done")
      }
    }, 50)
    return () => clearTimeout(t)
  }, [countdown, phase, blockIdx, round, blocks, totalRounds])

  function skip() {
    const nextIdx = blockIdx + 1
    if (nextIdx < blocks.length) {
      setBlockIdx(nextIdx)
      setCountdown(blocks[nextIdx].duration_seconds)
    } else if (round < totalRounds) {
      setRound((r) => r + 1)
      setBlockIdx(0)
      setCountdown(blocks[0].duration_seconds)
    } else {
      setPhase("done")
    }
  }

  function handleFinishClick() {
    if (isLongWorkout(elapsed)) {
      setShowDuration(true)
    } else {
      finish(elapsed)
    }
  }

  function finish(durationSeconds: number) {
    setShowDuration(false)
    setIsSaving(true)
    saveCardioSessionAction({
      routineId: routine.id,
      routineType: "cardio_custom",
      name: routine.name,
      durationSeconds,
      roundsCompleted: round,
    }).then((res) => {
      setIsSaving(false)
      if (res?.error) { toast.error(res.error); return }
      setPhase("done")
    })
  }

  if (phase === "done") {
    const stats: { label: string; value: string | number }[] = []
    if (totalRounds > 1) stats.push({ label: "rondas", value: round })
    return <CardioSummary routineName={routine.name} duration={elapsed} stats={stats} />
  }

  if (blocks.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">Esta rutina no tiene bloques configurados.</p>
      </div>
    )
  }

  const currentBlock = blocks[blockIdx]
  const nextBlock = blockIdx + 1 < blocks.length ? blocks[blockIdx + 1] : null
  const theme = blockTheme(currentBlock.name)
  const intensityLabel = currentBlock.intensity
    ? labelFor(INTENSITIES, currentBlock.intensity)
    : null

  // Colores según el tema del bloque
  const bgColor =
    theme === "work"
      ? "bg-red-950"
      : theme === "rest"
        ? "bg-emerald-950"
        : "bg-background"
  const nameColor =
    theme === "work"
      ? "text-red-100"
      : theme === "rest"
        ? "text-emerald-100"
        : "text-foreground"
  const countdownColor =
    theme === "work"
      ? "text-red-200"
      : theme === "rest"
        ? "text-emerald-200"
        : "text-primary"
  const mutedColor =
    theme === "neutral" ? "text-muted-foreground" : "text-white/50"
  const buttonClass =
    theme === "neutral"
      ? "border-border bg-muted/50 text-foreground"
      : "border-white/20 bg-white/10 text-white/80 active:bg-white/20"

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-500 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link
          href="/train"
          className={`flex items-center gap-1 text-sm ${mutedColor} hover:opacity-80`}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className={`font-workout text-sm font-bold tabular-nums ${mutedColor}`}>{fmt(elapsed)}</span>
        {totalRounds > 1 && (
          <span className={`font-workout text-sm font-bold tabular-nums ${mutedColor}`}>
            Ronda {round}/{totalRounds}
          </span>
        )}
      </div>

      {/* Progreso de bloques en la sesión */}
      <div className="flex gap-0.5 px-5">
        {blocks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < blockIdx
                ? theme === "neutral" ? "bg-primary" : "bg-white/50"
                : i === blockIdx
                  ? theme === "neutral" ? "bg-primary/60" : "bg-white/80"
                  : theme === "neutral" ? "bg-muted" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* Contenido central */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
        {/* Nombre del bloque */}
        <p
          className={`text-3xl font-black tracking-tight text-center ${nameColor}`}
        >
          {currentBlock.name}
        </p>

        {/* Intensidad del bloque (si aplica) */}
        {intensityLabel && (
          <p className={`text-sm font-semibold uppercase tracking-widest ${mutedColor}`}>
            {intensityLabel}
          </p>
        )}

        {/* Countdown */}
        <p
          className={`font-workout font-extrabold leading-none tabular-nums ${countdownColor}`}
          style={{ fontSize: "clamp(5rem, 22vw, 7.5rem)" }}
        >
          {fmt(countdown)}
        </p>

        {/* Siguiente bloque */}
        <div className={`mt-2 flex flex-col items-center gap-0.5 border-t pt-4 w-full max-w-xs text-center ${
          theme === "neutral" ? "border-border" : "border-white/10"
        }`}>
          {nextBlock ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedColor}`}>
                A continuación
              </p>
              <p className={`font-semibold ${nameColor} opacity-70`}>
                {nextBlock.name}
                <span className={`ml-2 font-workout text-sm font-bold tabular-nums ${mutedColor}`}>
                  {fmt(nextBlock.duration_seconds)}
                </span>
              </p>
            </>
          ) : round < totalRounds ? (
            <p className={`text-sm ${mutedColor}`}>
              Ronda {round + 1} → {blocks[0].name}
            </p>
          ) : (
            <p className={`text-sm font-semibold ${
              theme === "neutral" ? "text-primary" : "text-white/60"
            }`}>
              Último bloque
            </p>
          )}
        </div>

        <p className={`text-sm ${mutedColor}`}>
          Bloque {blockIdx + 1} de {blocks.length}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 px-5 pb-10">
        <button
          type="button"
          onClick={skip}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold disabled:opacity-40 ${buttonClass}`}
        >
          <SkipForward className="size-4" />
          Saltar
        </button>
        <button
          type="button"
          onClick={handleFinishClick}
          disabled={isSaving}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold disabled:opacity-40 ${buttonClass}`}
        >
          <CheckCircle2 className="size-4" />
          {isSaving ? "Guardando…" : "Terminar"}
        </button>
      </div>

      <DurationCorrectionDialog
        open={showDuration}
        elapsedSeconds={elapsed}
        onConfirm={(corrected) => finish(corrected)}
        onSkip={() => finish(elapsed)}
      />
    </div>
  )
}

// ===========================================================================
// Entry point
// ===========================================================================
export function CardioSessionRunner({ routine }: { routine: RoutineDetail }) {
  if (routine.type === "cardio_liss") return <LissRunner routine={routine} />
  if (routine.type === "cardio_hiit") return <HiitRunner routine={routine} />
  if (routine.type === "cardio_custom") return <IntervalsRunner routine={routine} />
  return null
}
