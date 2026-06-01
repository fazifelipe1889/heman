/**
 * EphaWordmark — Wordmark sólido para uso dentro de la app.
 * Sin gradiente, sin glow. Dorado plano (#D4A830).
 * Para header, legal y cualquier contexto interior.
 */
export function EphaWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClass = {
    sm: "text-base tracking-[0.18em]",
    md: "text-xl tracking-[0.20em]",
    lg: "text-3xl tracking-[0.22em]",
  }[size]

  return (
    <span
      className={`epha-wordmark-solid ${sizeClass} ${className}`}
      aria-label="EPHA"
    >
      EPHA
    </span>
  )
}
