"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { EphaLogo } from "@/components/epha-logo"

const SESSION_KEY = "epha-splash-seen"

/**
 * SplashScreen — overlay de marca animado al iniciar la app.
 * Reutiliza el logo completo `<EphaLogo />` (no lo redibuja).
 * Se muestra solo en la primera visita por sesión (sessionStorage) y
 * respeta `prefers-reduced-motion`.
 */
export function SplashScreen() {
  const reduceMotion = useReducedMotion()

  // Inicia oculto para coincidir con el HTML del servidor (sin desajuste de
  // hidratación). Tras montar, mostramos solo si no se vio en esta sesión.
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return
    sessionStorage.setItem(SESSION_KEY, "1")

    let timer = 0
    // rAF: difiere el reveal fuera del cuerpo síncrono del effect (evita
    // cascading renders) y deja que el primer frame pinte el fondo.
    const raf = requestAnimationFrame(() => {
      setVisible(true)
      const hold = reduceMotion ? 350 : 1900
      timer = window.setTimeout(() => setVisible(false), hold)
    })

    return () => {
      cancelAnimationFrame(raf)
      if (timer) window.clearTimeout(timer)
    }
  }, [reduceMotion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: "easeInOut" }}
          aria-hidden
        >
          <motion.div
            initial={
              reduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.92, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
          >
            <EphaLogo />
          </motion.div>

          {/* Barrido de luz que recorre toda la pantalla (no se corta en el logo) */}
          {!reduceMotion && (
            <span className="epha-shimmer-sweep" aria-hidden />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
