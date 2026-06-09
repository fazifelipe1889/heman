"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * NavigationProgress — barra de progreso fina en el borde superior que da
 * feedback INSTANTÁNEO al navegar.
 *
 * Problema que resuelve: al hacer click en un `<Link>`, Next no muestra nada
 * hasta que el server component del destino termina de renderizar. Con rutas
 * que consultan Supabase eso se siente "trabado". Esta barra arranca apenas se
 * hace click (o back/forward) y se completa cuando cambia el pathname.
 *
 * No depende de eventos del router (el App Router no los expone): intercepta
 * clicks en anchors internos + `popstate`, y cierra al detectar el cambio de
 * ruta. Respeta `prefers-reduced-motion` vía las transiciones de CSS globales.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const trickle = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopTrickle = React.useCallback(() => {
    if (trickle.current) {
      clearInterval(trickle.current)
      trickle.current = null
    }
  }, [])

  const start = React.useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    stopTrickle()
    setVisible(true)
    setProgress(8)
    // Trickle: avanza hacia ~90% sin llegar nunca (lo completa el cambio de ruta).
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)))
    }, 200)
  }, [stopTrickle])

  const done = React.useCallback(() => {
    stopTrickle()
    setProgress(100)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 280)
  }, [stopTrickle])

  // Arranca al hacer click en un link interno (fase de captura: antes de que
  // React procese la navegación).
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest("a")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      const target = anchor.getAttribute("target")
      if (!href || !href.startsWith("/") || target === "_blank") return
      if (anchor.hasAttribute("download")) return
      // Misma URL → no hay navegación.
      if (href === window.location.pathname + window.location.search) return
      start()
    }
    function onPopState() {
      start()
    }
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [start])

  // Completa cuando el pathname efectivamente cambió.
  const firstRender = React.useRef(true)
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    done()
  }, [pathname, done])

  React.useEffect(() => () => {
    stopTrickle()
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [stopTrickle])

  if (!visible) return null

  return (
    <div
      data-nav-progress
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5"
      aria-hidden
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
