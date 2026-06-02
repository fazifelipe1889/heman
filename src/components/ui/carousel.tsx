"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Carrusel horizontal con scroll-snap y flechas. Sin dependencias externas.
 * Cada hijo debe fijar su propio ancho (p. ej. `w-64 shrink-0`).
 */
export function Carousel({
  children,
  className,
  itemClassName,
}: {
  children: React.ReactNode
  className?: string
  /** Clases aplicadas al wrapper de cada slide. */
  itemClassName?: string
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = React.useState(false)
  const [canNext, setCanNext] = React.useState(false)

  const updateButtons = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  React.useEffect(() => {
    updateButtons()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateButtons, { passive: true })
    window.addEventListener("resize", updateButtons)
    return () => {
      el.removeEventListener("scroll", updateButtons)
      window.removeEventListener("resize", updateButtons)
    }
  }, [updateButtons])

  function scrollByDir(dir: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  const items = React.Children.toArray(children)

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div key={i} className={cn("snap-start shrink-0", itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      {(canPrev || canNext) && (
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
