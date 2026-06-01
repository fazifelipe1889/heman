"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ClipboardPlus } from "lucide-react"
import { toast } from "sonner"

import {
  REVIEW_FIELDS,
  REVIEW_SECTION_LABELS,
  getFieldsBySection,
  type ReviewSection,
} from "@/lib/domain/progress"
import { Button } from "@/components/ui/button"
import { createBodyReviewAction } from "./actions"

// ---------------------------------------------------------------------------
// Estado del formulario — todos los campos numéricos opcionales + fecha + notas
// ---------------------------------------------------------------------------
type FormState = Record<string, string>

const INITIAL: FormState = {
  review_date: new Date().toISOString().split("T")[0],
  notes: "",
  ...Object.fromEntries(REVIEW_FIELDS.map((f) => [f.key, ""])),
}

// ---------------------------------------------------------------------------
// Sección colapsable
// ---------------------------------------------------------------------------
function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {badge != null && badge > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campo numérico individual
// ---------------------------------------------------------------------------
function FieldInput({
  label,
  unit,
  fieldKey,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  unit: string
  fieldKey: string
  value: string
  min?: number
  max?: number
  step?: number
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        <span className="ml-1 text-muted-foreground/60">{unit}</span>
      </label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        placeholder="—"
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="h-11 rounded-xl border border-border bg-background px-3 text-center text-sm font-semibold tabular-nums placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formulario principal
// ---------------------------------------------------------------------------
export function BodyReviewForm() {
  const router = useRouter()
  const [form, setForm] = React.useState<FormState>(INITIAL)
  const [isPending, startTransition] = React.useTransition()

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Cuántos campos completados tiene una sección
  function sectionCount(section: ReviewSection): number {
    const fields = getFieldsBySection().get(section) ?? []
    return fields.filter((f) => form[f.key] !== "").length
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Convertir strings a números o null
    const num = (key: string) => {
      const v = form[key]
      if (v === "" || isNaN(Number(v))) return undefined
      return Number(v)
    }

    const payload = {
      review_date: form.review_date || new Date().toISOString().split("T")[0],
      notes: form.notes || null,
      ...Object.fromEntries(
        REVIEW_FIELDS.map((f) => [f.key, num(f.key) ?? null])
      ),
    }

    startTransition(async () => {
      const res = await createBodyReviewAction(payload)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Revisión guardada")
        router.push("/progress")
      }
    })
  }

  const sections = getFieldsBySection()

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 pb-28">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/progress"
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Progreso
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardPlus className="size-6 text-primary" />
            Nueva revisión
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos los campos son opcionales. Completá solo los que querés registrar.
          </p>
        </div>

        {/* Fecha */}
        <div className="rounded-2xl border border-border bg-card px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Fecha de la revisión</span>
            <input
              type="date"
              value={form.review_date}
              onChange={(e) => setField("review_date", e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>

        {/* Secciones colapsables */}
        {(
          [
            "basicas",
            "composicion",
            "medidas",
            "extremidades",
            "salud",
            "bienestar",
          ] as ReviewSection[]
        ).map((section) => {
          const fields = sections.get(section) ?? []
          return (
            <Section
              key={section}
              title={REVIEW_SECTION_LABELS[section]}
              badge={sectionCount(section)}
            >
              <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    label={f.label}
                    unit={f.unit}
                    fieldKey={f.key}
                    value={form[f.key]}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    onChange={setField}
                  />
                ))}
              </div>
            </Section>
          )
        })}

        {/* Notas libres */}
        <div className="rounded-2xl border border-border bg-card px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Notas</span>
            <textarea
              rows={3}
              placeholder="Observaciones, cómo te sentiste, contexto…"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </label>
        </div>
      </div>

      {/* Footer fijo */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={isPending}
          >
            {isPending ? "Guardando…" : "Guardar revisión"}
          </Button>
        </div>
      </div>
    </form>
  )
}
