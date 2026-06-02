import { ChevronDown } from "lucide-react"

import type { FaqItem } from "@/lib/domain/coaching"

/**
 * Acordeón de preguntas frecuentes sin JS (usa <details>/<summary>).
 * Renderizable desde un server component.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <details
          key={i}
          className="group rounded-xl border bg-card px-4 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-medium">
            {item.question}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="whitespace-pre-line pb-4 text-sm text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
