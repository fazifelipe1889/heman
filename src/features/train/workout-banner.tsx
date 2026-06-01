"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, X } from "lucide-react"

import { useWorkoutStore } from "@/stores/workout-store"
import { AbandonConfirmDialog } from "./workout-dialogs"

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, "0")}`
}

export function WorkoutBanner() {
  const [mounted, setMounted] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const pathname = usePathname()

  const isActive    = useWorkoutStore((s) => s.isActive)
  const routineId   = useWorkoutStore((s) => s.routineId)
  const routineName = useWorkoutStore((s) => s.routineName)
  const startTime   = useWorkoutStore((s) => s.startTime)
  const endWorkout  = useWorkoutStore((s) => s.endWorkout)

  React.useEffect(() => {
    setTimeout(() => setMounted(true), 0)
  }, [])

  React.useEffect(() => {
    if (!isActive || !startTime) return
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    )
    return () => clearInterval(t)
  }, [isActive, startTime])

  if (!mounted) return null
  if (!isActive) return null
  if (pathname === `/train/session/${routineId}`) return null

  return (
    <>
      <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/95 px-4 py-3 shadow-lg shadow-primary/10 backdrop-blur">
          {/* Ícono */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{routineName}</span>
            <span className="font-mono text-xs text-muted-foreground">{fmt(elapsed)}</span>
          </div>

          {/* Retomar */}
          <Link
            href={`/train/session/${routineId}`}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Retomar
          </Link>

          {/* Finalizar (con confirmación) */}
          <button
            type="button"
            aria-label="Finalizar entrenamiento"
            onClick={() => setShowConfirm(true)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Dialog de confirmación */}
      <AbandonConfirmDialog
        open={showConfirm}
        routineName={routineName ?? ""}
        elapsedSeconds={elapsed}
        onConfirm={() => {
          setShowConfirm(false)
          endWorkout()
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
