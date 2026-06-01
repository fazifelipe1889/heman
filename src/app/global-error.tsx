"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("[EPHA global-error]", error.message, error.digest)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          fontFamily: "sans-serif",
          background: "#080808",
          color: "#fff",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          Algo salió mal
        </h1>
        <p style={{ color: "#888", fontSize: "0.875rem", maxWidth: 360 }}>
          Ocurrió un error inesperado. Podés reintentar o volver al inicio.
        </p>
        {error.digest && (
          <p style={{ color: "#555", fontSize: "0.75rem", fontFamily: "monospace" }}>
            ref: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button
            onClick={unstable_retry}
            style={{
              padding: "8px 20px",
              background: "#C8A94A",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
          <a
            href="/login"
            style={{
              padding: "8px 20px",
              background: "transparent",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Ir al login
          </a>
        </div>
      </body>
    </html>
  )
}
