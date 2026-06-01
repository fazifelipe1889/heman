"use client"

import * as React from "react"

import type { Quote, QuoteCategory } from "@/lib/domain/quotes"
import {
  filterQuotes,
  pickQuote,
  SEEN_HISTORY_SIZE,
} from "@/lib/domain/quotes"

const STORAGE_KEY = "heman_quote_seen"

type Props = {
  activeCategories: QuoteCategory[]
}

export function QuoteCard({ activeCategories }: Props) {
  const [quote, setQuote] = React.useState<Quote | null>(null)
  const [visible, setVisible] = React.useState(false)

  const pool = React.useMemo(
    () => filterQuotes(activeCategories),
    [activeCategories],
  )

  function getSeenIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  function pushSeen(id: string) {
    const seen = getSeenIds()
    const next = [...seen, id].slice(-SEEN_HISTORY_SIZE)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (pool.length === 0) return
      const picked = pickQuote(pool, getSeenIds())
      pushSeen(picked.id)
      setQuote(picked)
      setVisible(true)
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!quote) return null

  return (
    <div
      className={`flex flex-col items-center gap-2 py-2 text-center transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <p className="text-sm font-medium leading-relaxed text-foreground/75 italic max-w-xs">
        &ldquo;{quote.text}&rdquo;
      </p>
      {(quote.author || quote.source) && (
        <p className="text-xs text-muted-foreground/60">
          {quote.author ?? quote.source}
          {quote.author && quote.source && (
            <span className="opacity-70"> · {quote.source}</span>
          )}
        </p>
      )}
    </div>
  )
}
