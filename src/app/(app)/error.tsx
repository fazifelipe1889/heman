"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("[EPHA app-error]", error.message, error.digest)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-xl font-bold">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Ocurrió un error inesperado.
        {error.digest && (
          <span className="block font-mono text-xs mt-1 opacity-60">
            ref: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3">
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
