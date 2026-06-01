"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import type { Supplement } from "@/lib/db/supplements"
import {
  SUPPLEMENT_COLORS,
  SUPPLEMENT_COLOR_CLASSES,
  TIMES_OF_DAY,
} from "@/lib/domain/supplements"
import { WEEKDAYS } from "@/lib/domain/training"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createSupplementAction,
  updateSupplementAction,
} from "./actions"

type Props = {
  supplement?: Supplement
}

export function SupplementForm({ supplement }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const [selectedDays, setSelectedDays] = React.useState<number[]>(
    supplement?.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
  )
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>(
    supplement?.times_of_day ?? [],
  )
  const [selectedColor, setSelectedColor] = React.useState<string>(
    supplement?.color ?? "blue",
  )

  function toggleDay(v: number) {
    setSelectedDays((prev) =>
      prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v],
    )
  }

  function toggleTime(v: string) {
    setSelectedTimes((prev) =>
      prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v],
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (selectedDays.length === 0) {
      setError("Seleccioná al menos un día")
      return
    }

    const fd = new FormData(e.currentTarget)
    // Reemplazar los campos de arrays (los inputs hidden los ponemos nosotros)
    fd.delete("days_of_week")
    fd.delete("times_of_day")
    selectedDays.forEach((d) => fd.append("days_of_week", String(d)))
    selectedTimes.forEach((t) => fd.append("times_of_day", t))

    startTransition(async () => {
      if (supplement) {
        const res = await updateSupplementAction(supplement.id, fd)
        if (res.error) { setError(res.error); return }
      } else {
        const res = await createSupplementAction(fd)
        if (res.error) { setError(res.error); return }
      }
      router.push("/supplements")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Nombre + dosis */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={supplement?.name}
            placeholder="Ej: Creatina, Proteína, Vitamina D…"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dose">Dosis</Label>
          <Input
            id="dose"
            name="dose"
            defaultValue={supplement?.dose}
            placeholder="Ej: 5 g, 1 cápsula, 10 ml…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={supplement?.notes}
            placeholder="Ej: tomar en ayunas, con comida…"
            rows={2}
          />
        </div>
      </div>

      {/* Días */}
      <div className="flex flex-col gap-2">
        <Label>Días *</Label>
        <div className="flex gap-1.5">
          {WEEKDAYS.map((d) => {
            const active = selectedDays.includes(d.value)
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {d.short}
              </button>
            )
          })}
        </div>
        {selectedDays.length === 0 && (
          <p className="text-xs text-destructive">Seleccioná al menos un día</p>
        )}
      </div>

      {/* Horario (opcional) */}
      <div className="flex flex-col gap-2">
        <Label>Momento del día <span className="text-muted-foreground">(opcional)</span></Label>
        <div className="flex flex-wrap gap-2">
          {TIMES_OF_DAY.map((t) => {
            const active = selectedTimes.includes(t.value)
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTime(t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex gap-2">
          {SUPPLEMENT_COLORS.map((c) => {
            const cls = SUPPLEMENT_COLOR_CLASSES[c]
            const active = selectedColor === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`size-7 rounded-full transition-transform ${cls.dot} ${
                  active ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"
                }`}
                aria-label={c}
              />
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {supplement ? "Guardar cambios" : "Crear suplemento"}
        </Button>
      </div>
    </form>
  )
}
