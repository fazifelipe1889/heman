"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import {
  QUOTE_CATEGORY_LIST,
  type QuoteCategory,
} from "@/lib/domain/quotes"
import type { QuotePreferences } from "@/lib/db/quote-preferences"
import { saveQuotePreferencesAction } from "./actions"

type Props = {
  preferences: QuotePreferences
}

export function QuoteSettingsForm({ preferences }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [enabled, setEnabled] = React.useState(preferences.enabled)
  const [selectedCats, setSelectedCats] = React.useState<Set<QuoteCategory>>(
    () =>
      preferences.categories.length > 0
        ? new Set(preferences.categories)
        : new Set(QUOTE_CATEGORY_LIST.map((c) => c.key)),
  )

  const allSelected =
    selectedCats.size === QUOTE_CATEGORY_LIST.length

  function toggleCat(key: QuoteCategory) {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size <= 1) return prev // mínimo 1 categoría
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      // Dejar solo la primera
      setSelectedCats(new Set([QUOTE_CATEGORY_LIST[0].key]))
    } else {
      setSelectedCats(new Set(QUOTE_CATEGORY_LIST.map((c) => c.key)))
    }
  }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("enabled", String(enabled))
      // Si están todas seleccionadas, enviamos vacío (= todas)
      const cats = allSelected ? [] : Array.from(selectedCats)
      cats.forEach((c) => fd.append("categories", c))
      await saveQuotePreferencesAction(fd)
      router.push("/settings")
      router.refresh()
    })
  }

  const spiritual = QUOTE_CATEGORY_LIST.filter((c) => c.spiritual)
  const nonSpiritual = QUOTE_CATEGORY_LIST.filter((c) => !c.spiritual)

  return (
    <div className="flex flex-col gap-6">
      {/* Toggle principal */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Mostrar frases</p>
          <p className="text-sm text-muted-foreground">
            Aparece al inicio del dashboard
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Categorías */}
      {enabled && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Categorías</p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
          </div>

          {/* No espirituales */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Motivación & Filosofía
            </p>
            {nonSpiritual.map((cat) => (
              <CategoryToggle
                key={cat.key}
                meta={cat}
                active={selectedCats.has(cat.key)}
                onToggle={() => toggleCat(cat.key)}
                disabled={selectedCats.has(cat.key) && selectedCats.size === 1}
              />
            ))}
          </div>

          {/* Espirituales */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Espiritualidad & Fe
            </p>
            <p className="text-xs text-muted-foreground -mt-1">
              Contenido opcional. Desactivalo si no es para vos.
            </p>
            {spiritual.map((cat) => (
              <CategoryToggle
                key={cat.key}
                meta={cat}
                active={selectedCats.has(cat.key)}
                onToggle={() => toggleCat(cat.key)}
                disabled={selectedCats.has(cat.key) && selectedCats.size === 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Guardar */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar preferencias
      </button>
    </div>
  )
}

function CategoryToggle({
  meta,
  active,
  onToggle,
  disabled,
}: {
  meta: (typeof QUOTE_CATEGORY_LIST)[number]
  active: boolean
  onToggle: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card opacity-50"
      } ${disabled ? "cursor-not-allowed" : ""}`}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="text-xs text-muted-foreground">{meta.description}</span>
      </div>
      <div
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        }`}
      >
        {active && (
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  )
}
