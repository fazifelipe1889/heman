"use client"

import * as React from "react"
import { AlertTriangle, Clock } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ─── Constante de umbral ────────────────────────────────────────────────────

/** 3 horas y 30 minutos en segundos */
export const LONG_WORKOUT_THRESHOLD = 3 * 3600 + 30 * 60 // 12 600 s

export function isLongWorkout(elapsedSeconds: number) {
  return elapsedSeconds > LONG_WORKOUT_THRESHOLD
}

function fmtHM(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ─── Dialog 1: corrección de duración ───────────────────────────────────────
// Se usa cuando el usuario finaliza un entrenamiento que lleva >3:30 h.
// Le permite corregir la duración real antes de guardar.

type DurationCorrectionDialogProps = {
  open: boolean
  elapsedSeconds: number
  /** Guardar con la duración corregida (en segundos) */
  onConfirm: (correctedSeconds: number) => void
  /** Guardar con la duración real sin corregir */
  onSkip: () => void
}

export function DurationCorrectionDialog({
  open,
  elapsedSeconds,
  onConfirm,
  onSkip,
}: DurationCorrectionDialogProps) {
  const defaultH = Math.floor(elapsedSeconds / 3600)
  const defaultM = Math.floor((elapsedSeconds % 3600) / 60)

  const [hours, setHours] = React.useState(defaultH)
  const [minutes, setMinutes] = React.useState(defaultM)

  // Resetear a valor real cada vez que se abre
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setHours(Math.floor(elapsedSeconds / 3600))
      setMinutes(Math.floor((elapsedSeconds % 3600) / 60))
    }, 0)
    return () => clearTimeout(t)
  }, [open, elapsedSeconds])

  function handleConfirm() {
    const corrected = Math.max(60, hours * 3600 + minutes * 60)
    onConfirm(corrected)
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="size-5 text-amber-500" />
          </div>
          <DialogTitle>¿Cuánto duró realmente?</DialogTitle>
          <DialogDescription>
            El entrenamiento lleva <strong>{fmtHM(elapsedSeconds)}</strong> abierto.
            Puede que lo hayas olvidado encendido. Corregí la duración antes de guardar.
          </DialogDescription>
        </DialogHeader>

        {/* Inputs de horas y minutos */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              className="h-14 w-16 rounded-xl border border-border bg-muted/30 text-center text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">horas</span>
          </div>
          <span className="mb-4 text-2xl font-bold text-muted-foreground">:</span>
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              min={0}
              max={59}
              value={String(minutes).padStart(2, "0")}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="h-14 w-16 rounded-xl border border-border bg-muted/30 text-center text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">minutos</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            <Clock className="mr-1.5 size-3.5" />
            Guardar tal cual ({fmtHM(elapsedSeconds)})
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Guardar con corrección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog 2: confirmación de abandono ─────────────────────────────────────
// Se usa cuando el usuario toca la ✕ del banner con entrenamiento activo.

type AbandonConfirmDialogProps = {
  open: boolean
  routineName: string
  elapsedSeconds: number
  onConfirm: () => void
  onCancel: () => void
}

export function AbandonConfirmDialog({
  open,
  routineName,
  elapsedSeconds,
  onConfirm,
  onCancel,
}: AbandonConfirmDialogProps) {
  const isLong = isLongWorkout(elapsedSeconds)

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Finalizar entrenamiento?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{routineName}</span>
            {" "}se descartará y el progreso no se guardará.
          </DialogDescription>
          {isLong && (
            <div className="mt-1 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-500">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                El entrenamiento lleva <strong>{fmtHM(elapsedSeconds)}</strong> activo.
                Puede que lo hayas olvidado encendido.
              </span>
            </div>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            Sí, finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
