"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"

import { buttonVariants } from "@/components/ui/button"
import { EphaLogo } from "@/components/epha-logo"
import { cn } from "@/lib/utils"

export default function Home() {
  const reduceMotion = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: 0.1 },
    },
  }
  const item = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" as const },
    },
  }

  return (
    <motion.main
      className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex flex-col items-center">
        <EphaLogo />
        <p className="mt-6 max-w-md text-balance text-muted-foreground">
          Tu gimnasio, optimizado. Planificá, entrená y seguí tu progreso sin
          perder tiempo entre series.
        </p>
      </motion.div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <motion.div variants={item}>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-base")}
          >
            Crear cuenta
          </Link>
        </motion.div>
        <motion.div variants={item}>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full text-base"
            )}
          >
            Iniciar sesión
          </Link>
        </motion.div>
      </div>
    </motion.main>
  )
}
