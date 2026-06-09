"use client"

import * as React from "react"

import { SpotlightTour } from "@/components/tour/spotlight-tour"
import { TOUR_STEPS } from "./steps"
import { completeTourAction } from "./actions"

const STORAGE_KEY = "epha_tour_done"

/**
 * Decide si lanzar el tour de bienvenida y persiste que ya se vio.
 * Fuente de verdad: `profiles.tour_completed_at` (multi-dispositivo). Respaldo:
 * localStorage, para que el tour no reaparezca antes de aplicar la migración
 * 0027 ni mientras el write server-side viaja.
 */
export function TourLauncher({
  alreadyCompleted,
  forceOpen,
}: {
  alreadyCompleted: boolean
  forceOpen: boolean
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => {
      let seenLocal = false
      try {
        seenLocal = localStorage.getItem(STORAGE_KEY) === "1"
      } catch {
        seenLocal = false
      }
      setOpen(forceOpen || (!alreadyCompleted && !seenLocal))
    }, 0)
    return () => clearTimeout(t)
  }, [alreadyCompleted, forceOpen])

  const finish = React.useCallback(() => {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore
    }
    void completeTourAction()
  }, [])

  if (!open) return null

  return <SpotlightTour steps={TOUR_STEPS} onFinish={finish} />
}
