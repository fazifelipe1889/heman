"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Check, Minus, Plus, Timer, Trophy } from "lucide-react"
import { toast } from "sonner"

import type { RoutineDetail } from "@/lib/db/routines"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkoutStore, type WorkoutExRow, type WorkoutSetRow } from "@/stores/workout-store"
import { saveMusculacionSessionAction } from "./session-actions"
import {
  DurationCorrectionDialog,
  isLongWorkout,
} from "./workout-dialogs"

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function fmt(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Iniciales para el avatar circular del ejercicio (sin imagen aún) */
function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Formatea los valores objetivo como "25kg×10×2" para mostrar el previo */
function formatPrevio(set: WorkoutSetRow): string {
  const parts: string[] = []
  if (set.targetWeight != null) parts.push(`${set.targetWeight}kg`)
  if (set.targetReps) parts.push(set.targetReps)
  if (set.targetRir != null) parts.push(`${set.targetRir}`)
  return parts.length > 0 ? parts.join("×") : "—"
}

/** Construye el estado inicial de ejercicios a partir de la rutina */
function buildExRows(routine: RoutineDetail): WorkoutExRow[] {
  return routine.exercises.map((ex) => ({
    name: ex.exercise_name,
    ref: ex.exercise_ref,
    restSeconds: ex.rest_seconds ?? 90,
    notes: "",
    sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({
      targetReps: ex.target_reps,
      targetWeight: ex.target_weight,
      targetRir: ex.target_rir,
      actualWeight: ex.target_weight ?? undefined,
      actualReps: undefined,
      actualRir: undefined,
      completed: false,
    })),
  }))
}

// ===========================================================================
// Runner principal
// ===========================================================================
export function MusculacionSessionRunner({ routine }: { routine: RoutineDetail }) {
  // ----- Store -----
  const isActive      = useWorkoutStore((s) => s.isActive)
  const storeRoutineId = useWorkoutStore((s) => s.routineId)
  const startTime     = useWorkoutStore((s) => s.startTime)
  const exercises     = useWorkoutStore((s) => s.exercises)
  const selectedExIndex = useWorkoutStore((s) => s.selectedExIndex)
  const restEndTime   = useWorkoutStore((s) => s.restEndTime)

  const startWorkout  = useWorkoutStore((s) => s.startWorkout)
  const endWorkout    = useWorkoutStore((s) => s.endWorkout)
  const setSelectedEx = useWorkoutStore((s) => s.setSelectedEx)
  const updateSet     = useWorkoutStore((s) => s.updateSet)
  const toggleSet     = useWorkoutStore((s) => s.toggleSet)
  const addSet        = useWorkoutStore((s) => s.addSet)
  const removeSet     = useWorkoutStore((s) => s.removeSet)
  const setNote       = useWorkoutStore((s) => s.setNote)
  const clearRest     = useWorkoutStore((s) => s.clearRest)
  const extendRest    = useWorkoutStore((s) => s.extendRest)

  // ----- Estados locales -----
  const [mounted, setMounted]   = React.useState(false)
  const [elapsed, setElapsed]   = React.useState(0)
  const [restLeft, setRestLeft] = React.useState(0)
  const [phase, setPhase]             = React.useState<"run" | "done">("run")
  const [isSaving, setIsSaving]       = React.useState(false)
  const [showDuration, setShowDuration] = React.useState(false)
  const [summary, setSummary]         = React.useState<{
    duration: number; sets: number; volume: number
  } | null>(null)

  // ----- Hidratación -----
  // Esperamos al cliente para leer el store persisted y evitar hydration mismatch
  React.useEffect(() => {
    setTimeout(() => setMounted(true), 0)
  }, [])

  // ----- Inicializar workout en el store -----
  React.useEffect(() => {
    if (!mounted) return
    // Si ya hay workout activo para ESTA rutina → retomar
    if (isActive && storeRoutineId === routine.id) return
    // Cualquier otro caso → comenzar fresco
    startWorkout({
      routineId: routine.id,
      routineName: routine.name,
      exercises: buildExRows(routine),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // ----- Cronómetro de sesión -----
  React.useEffect(() => {
    if (!mounted || !startTime) return
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000
    )
    return () => clearInterval(t)
  }, [mounted, startTime])

  // ----- Countdown de descanso -----
  React.useEffect(() => {
    if (!restEndTime) {
      // setState dentro de setTimeout para cumplir react-hooks/set-state-in-effect
      const t = setTimeout(() => setRestLeft(0), 0)
      return () => clearTimeout(t)
    }
    const tick = () => {
      const left = Math.max(0, Math.floor((restEndTime - Date.now()) / 1000))
      setRestLeft(left)
      if (left <= 0) clearRest()
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [restEndTime, clearRest])

  // ----- Finalizar -----

  /** Punto de entrada: si el workout es largo pide corrección, si no guarda directo */
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
    const duration = durationSeconds
    saveMusculacionSessionAction({
      routineId: routine.id,
      name: routine.name,
      durationSeconds: durationSeconds,
      exercises: exercises.map((ex) => ({
        exerciseName: ex.name,
        exerciseRef: ex.ref,
        sets: ex.sets.map((s) => ({
          targetReps: s.targetReps,
          targetWeight: s.targetWeight,
          targetRir: s.targetRir,
          actualReps: s.actualReps ?? null,
          actualWeight: s.actualWeight ?? null,
          actualRir: s.actualRir ?? null,
          completed: s.completed,
        })),
      })),
    }).then((res) => {
      setIsSaving(false)
      if (res?.error) { toast.error(res.error); return }

      const completedSets = exercises.reduce(
        (a, ex) => a + ex.sets.filter((s) => s.completed).length, 0
      )
      const volume = exercises.reduce(
        (a, ex) =>
          a + ex.sets.reduce(
            (s, set) =>
              s + (set.completed && set.actualReps && set.actualWeight
                ? set.actualReps * set.actualWeight : 0),
            0
          ),
        0
      )
      setSummary({ duration, sets: completedSets, volume })
      endWorkout()
      setPhase("done")
    })
  }

  // ----- Dialog de corrección de duración -----
  const durationDialog = (
    <DurationCorrectionDialog
      open={showDuration}
      elapsedSeconds={elapsed}
      onConfirm={(corrected) => finish(corrected)}
      onSkip={() => finish(elapsed)}
    />
  )

  // ----- Resumen -----
  if (phase === "done" && summary) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Trophy className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">¡Entrenamiento guardado!</h1>
          <p className="text-sm text-muted-foreground">{routine.name}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          {[
            { label: "Duración", value: fmt(summary.duration) },
            { label: "Series",   value: summary.sets },
            { label: "Volumen",  value: `${Math.round(summary.volume)} kg` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col rounded-xl bg-muted/50 px-3 py-3">
              <span className="font-workout text-xl font-bold tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2">
          <Link href="/train" className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
            Volver a Entrenar
          </Link>
          <Link href="/dashboard" className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-base font-medium">
            Inicio
          </Link>
        </div>
      </div>
    )
  }

  // ----- Loading (antes de hidratación) -----
  if (!mounted || exercises.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Cargando…</span>
      </div>
    )
  }

  const ex = exercises[selectedExIndex]

  const totalSets     = exercises.reduce((a, e) => a + e.sets.length, 0)
  const completedSets = exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length, 0
  )

  return (
    <div className="flex flex-col pb-10">
      {/* ================================================================
          HEADER FIJO: ← | cronómetro | Finalizar
      ================================================================ */}
      <div className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          {/* Volver (mantiene workout activo) */}
          <Link
            href="/train"
            aria-label="Volver"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>

          {/* Cronómetro central */}
          <div className="flex flex-1 flex-col items-center">
            <span className="font-workout text-xl font-bold tabular-nums leading-none">
              {fmt(elapsed)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {completedSets}/{totalSets} series
            </span>
          </div>

          {/* Finalizar */}
          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={handleFinishClick}
            className="h-9 shrink-0 px-4 text-sm font-semibold"
          >
            {isSaving ? "…" : "Finalizar"}
          </Button>
        </div>

        {/* Barra de progreso */}
        <div className="h-0.5 w-full bg-muted/40">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-4">
        {/* ================================================================
            NOMBRE DE LA RUTINA
        ================================================================ */}
        <h1 className="mt-5 text-lg font-bold tracking-tight">{routine.name}</h1>

        {/* ================================================================
            CARRUSEL DE EJERCICIOS
        ================================================================ */}
        <div
          className="mt-3 flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {exercises.map((e, i) => {
            const done  = e.sets.every((s) => s.completed)
            const inProg = !done && e.sets.some((s) => s.completed)
            const isSelected = i === selectedExIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedEx(i)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : done
                        ? "bg-primary/20 text-primary"
                        : inProg
                          ? "bg-muted border-2 border-primary/50 text-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {initials(e.name)}
                </div>
                {/* Indicador de completado */}
                <div
                  className={`h-1 w-8 rounded-full ${
                    done ? "bg-primary" : inProg ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* ================================================================
            TIMER DE DESCANSO (aparece al completar una serie)
        ================================================================ */}
        {restLeft > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3">
            <Timer className="size-5 shrink-0 text-primary" />
            <span className="font-workout text-2xl font-bold tabular-nums text-primary">
              {fmt(restLeft)}
            </span>
            <span className="text-sm text-muted-foreground">descanso</span>
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={() => extendRest(15)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={clearRest}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Saltar
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            EJERCICIO SELECCIONADO
        ================================================================ */}
        <div className="mt-5">
          {/* Nombre */}
          <h2 className="text-xl font-bold tracking-tight">{ex.name}</h2>

          {/* Nota del ejercicio */}
          <input
            type="text"
            placeholder="Nota sobre este ejercicio…"
            value={ex.notes}
            onChange={(e) => setNote(selectedExIndex, e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* ============================================================
              TABLA DE SERIES
          ============================================================ */}
          <div className="mt-4">
            {/* Cabecera */}
            <div className="mb-1 grid grid-cols-[52px_1fr_1fr_1fr_2.5rem_2rem] items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>#</span>
              <span className="text-center">kg</span>
              <span className="text-center">Reps</span>
              <span className="text-center">RIR</span>
              <span className="text-center">✓</span>
              <span />
            </div>

            <div className="flex flex-col gap-1.5">
              {ex.sets.map((s, setI) => (
                <div
                  key={setI}
                  className={`grid grid-cols-[52px_1fr_1fr_1fr_2.5rem_2rem] items-center gap-1.5 rounded-xl px-1 py-1 transition-colors ${
                    s.completed ? "bg-primary/10" : "bg-muted/20"
                  }`}
                >
                  {/* Número + previo */}
                  <div className="flex flex-col items-center leading-tight">
                    <span className="font-workout text-sm font-bold tabular-nums text-foreground">
                      {setI + 1}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatPrevio(s)}
                    </span>
                  </div>

                  {/* Peso */}
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    placeholder={s.targetWeight != null ? String(s.targetWeight) : "—"}
                    value={s.actualWeight ?? ""}
                    className="h-11 text-center text-sm font-bold font-workout tabular-nums"
                    onChange={(e) =>
                      updateSet(selectedExIndex, setI, {
                        actualWeight:
                          e.target.value === "" ? undefined : e.target.valueAsNumber,
                      })
                    }
                  />

                  {/* Reps */}
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={s.targetReps ?? "—"}
                    value={s.actualReps ?? ""}
                    className="h-11 text-center text-sm font-bold font-workout tabular-nums"
                    onChange={(e) =>
                      updateSet(selectedExIndex, setI, {
                        actualReps:
                          e.target.value === "" ? undefined : e.target.valueAsNumber,
                      })
                    }
                  />

                  {/* RIR */}
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={10}
                    placeholder={s.targetRir != null ? String(s.targetRir) : "—"}
                    value={s.actualRir ?? ""}
                    className="h-11 text-center text-sm font-bold font-workout tabular-nums"
                    onChange={(e) =>
                      updateSet(selectedExIndex, setI, {
                        actualRir:
                          e.target.value === "" ? undefined : e.target.valueAsNumber,
                      })
                    }
                  />

                  {/* Check */}
                  <button
                    type="button"
                    onClick={() => toggleSet(selectedExIndex, setI)}
                    aria-label="Completar serie"
                    className={`flex size-9 items-center justify-center justify-self-center rounded-full border-2 transition-all ${
                      s.completed
                        ? "border-primary bg-primary text-primary-foreground scale-110"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>

                  {/* Eliminar serie (solo si hay más de 1) */}
                  {ex.sets.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSet(selectedExIndex, setI)}
                      aria-label="Eliminar serie"
                      className="flex size-7 items-center justify-center justify-self-center rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Minus className="size-3.5" />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>

            {/* Agregar serie */}
            <button
              type="button"
              onClick={() => addSet(selectedExIndex)}
              className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
              Agregar serie
            </button>
          </div>
        </div>
      </div>

      {durationDialog}
    </div>
  )
}
