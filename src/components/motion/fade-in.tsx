"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

/**
 * FadeIn — entrada suave (fade + desplazamiento) que respeta
 * `prefers-reduced-motion`. Wrapper genérico para client components.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 12,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
