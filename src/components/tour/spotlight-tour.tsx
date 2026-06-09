"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"

import type { TourStep } from "@/features/onboarding-tour/steps"
import { Button, buttonVariants } from "@/components/ui/button"

type Rect = { top: number; left: number; width: number; height: number }

const HALO = 8 // halo oscuro alrededor del target
const GAP = 14 // separación entre target y cartelito
const CARD_WIDTH = 300

/**
 * Tour guiado tipo spotlight. Oscurece la pantalla y resalta un elemento a la
 * vez (medido por `getBoundingClientRect`) con un cartelito. La navegación es
 * solo por botones; una capa transparente intercepta los clicks del fondo.
 *
 * Cuidado con los gotchas de React 19 del proyecto: nada de setState síncrono
 * en el cuerpo de un effect (se usa setTimeout/callbacks).
 */
export function SpotlightTour({
  steps,
  onFinish,
}: {
  steps: TourStep[]
  onFinish: () => void
}) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [visibleSteps, setVisibleSteps] = React.useState<TourStep[]>([])
  const [index, setIndex] = React.useState(0)
  const [rect, setRect] = React.useState<Rect | null>(null)
  const [viewport, setViewport] = React.useState({ w: 0, h: 0 })

  // Filtrar pasos cuyo target no exista en el DOM (la frase solo aparece si
  // está habilitada; "Ser coach"/"Panel de coach" comparten data-tour).
  React.useEffect(() => {
    const t = setTimeout(() => {
      const filtered = steps.filter(
        (s) => !s.target || document.querySelector(`[data-tour="${s.target}"]`),
      )
      setVisibleSteps(filtered)
      setViewport({ w: window.innerWidth, h: window.innerHeight })
      setMounted(true)
    }, 0)
    return () => clearTimeout(t)
  }, [steps])

  const step = visibleSteps[index]

  const measure = React.useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight })
    const target = step?.target
    if (!target) {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  // Al cambiar de paso: scroll al target y medir; recalcular en resize/scroll.
  React.useEffect(() => {
    if (!mounted || !step) return
    const el = step.target
      ? document.querySelector(`[data-tour="${step.target}"]`)
      : null
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })
    const t = setTimeout(measure, reduce ? 0 : 280)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [mounted, step, measure, reduce])

  // Esc = saltar.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onFinish])

  if (!mounted || visibleSteps.length === 0 || !step) return null

  const isLast = index >= visibleSteps.length - 1
  const goNext = () => (isLast ? onFinish() : setIndex((i) => i + 1))
  const goBack = () => setIndex((i) => Math.max(0, i - 1))

  // Posición del cartelito (debajo del target si hay espacio, si no arriba).
  const cardW = Math.min(CARD_WIDTH, viewport.w - 24)
  let cardStyle: React.CSSProperties
  if (!rect) {
    cardStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: cardW,
    }
  } else {
    const half = cardW / 2
    const cx = Math.max(
      12 + half,
      Math.min(rect.left + rect.width / 2, viewport.w - 12 - half),
    )
    const spaceBelow = viewport.h - (rect.top + rect.height)
    const placeBelow = spaceBelow > rect.top
    cardStyle = placeBelow
      ? { top: rect.top + rect.height + GAP, left: cx, transform: "translateX(-50%)", width: cardW }
      : { top: rect.top - GAP, left: cx, transform: "translate(-50%,-100%)", width: cardW }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Captura de clicks del fondo (navegación solo por botones). */}
      <div className="absolute inset-0" aria-hidden />

      {/* Oscurecido: recorte alrededor del target, o plano si está centrado. */}
      {rect ? (
        <div
          aria-hidden
          className="ring-primary pointer-events-none rounded-xl ring-2 transition-all duration-200"
          style={{
            position: "absolute",
            top: rect.top - HALO,
            left: rect.left - HALO,
            width: rect.width + HALO * 2,
            height: rect.height + HALO * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" aria-hidden />
      )}

      {/* Cartelito. La posición (left/top/transform) va en el contenedor; el
          fade lo maneja motion en un hijo para no pisar el transform de centrado. */}
      <div className="fixed" style={cardStyle}>
      <motion.div
        key={step.id}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        role="dialog"
        aria-label={step.title}
        className="bg-card text-card-foreground flex w-full flex-col gap-3 rounded-xl border p-4 shadow-xl"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold">{step.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
        </div>

        {step.cta && (
          <Link
            href={step.cta.href}
            onClick={onFinish}
            className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
          >
            {step.cta.label}
          </Link>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onFinish}
            className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            Saltar
          </button>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {index + 1} / {visibleSteps.length}
            </span>
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={goBack}>
                Atrás
              </Button>
            )}
            <Button size="sm" onClick={goNext}>
              {isLast ? "Listo" : "Siguiente"}
            </Button>
          </div>
        </div>
      </motion.div>
      </div>
    </div>,
    document.body,
  )
}
