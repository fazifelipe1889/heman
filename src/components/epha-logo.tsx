/**
 * EphaLogo — Logo completo con gradiente dorado + glow.
 * Solo para pantallas de auth (login/register) y splash.
 * Fuentes cargadas vía CSS variables definidas en layout.tsx.
 */
export function EphaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* effatá — coronación espiritual */}
      <span className="epha-effata">effatá</span>

      {/* Ornamento superior: línea · punto · línea */}
      <div className="epha-ornament-top">
        <div className="epha-line epha-line-left" />
        <div className="epha-dot-single" />
        <div className="epha-line epha-line-right" />
      </div>

      {/* Wordmark principal */}
      <span className="epha-wordmark">EPHA</span>

      {/* Ornamento inferior: línea · 3 puntos · línea */}
      <div className="epha-ornament-bottom">
        <div className="epha-line epha-line-left" />
        <div className="epha-dots">
          <span />
          <span className="epha-dot-mid" />
          <span />
        </div>
        <div className="epha-line epha-line-right" />
      </div>

      {/* Tagline */}
      <span className="epha-tagline">Open your limits</span>

      {/* Versículo */}
      <span className="epha-verse">Marcos 7:34</span>
    </div>
  )
}
