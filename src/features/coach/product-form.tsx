"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Plus,
  X,
  MessageCircle,
  Video,
  Dumbbell,
  Pill,
  LineChart,
  FileText,
  Mic,
  ImageIcon,
  FileUp,
  Film,
  ClipboardList,
  Apple,
  CalendarRange,
  Lock,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react"

import {
  COACHING_CATEGORY_OPTIONS,
  COACHING_LEVEL_OPTIONS,
  PRODUCT_TYPE_LABELS,
  INTAKE_FIELD_TYPE_OPTIONS,
} from "@/lib/domain/labels"
import {
  readFaq,
  readIncludes,
  readPerks,
  readContentBlocks,
  readIntakeForm,
  readRoutineTemplatePayload,
  readCategories,
} from "@/lib/domain/coaching"
import type { ProductType } from "@/lib/domain/coaching"
import { FORMULA_INTAKE_FIELDS, PREDEFINED_COMMANDS } from "@/lib/domain/nutrition-formulas"
import { MUSCLE_GROUPS_ES } from "@/lib/domain/exercises"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form } from "@/components/ui/form"
import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
} from "@/features/routines/fields"
import type {
  CoachingProgram,
  CoachingPlan,
  CoachingProgramContent,
} from "@/lib/supabase/types"
import { createProductAction, updateProductAction } from "./actions"
import { productSchema, type ProductValues } from "./schema"

const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS_ES.map((g) => ({ value: g, label: g }))

/** Colores de acento disponibles para resaltar el cuadrante de precio. */
const ACCENT_COLORS = [
  { value: "", label: "Sin color" },
  { value: "#6366f1", label: "Índigo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f97316", label: "Naranja" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f59e0b", label: "Ámbar" },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

function PerkRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 text-left"
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <span
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-background transition-transform",
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
      {enabled && children}
    </div>
  )
}

function ContentSlot({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 opacity-70">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
        <Lock className="size-3" /> Próximamente
      </Badge>
    </div>
  )
}

function NutritionCommandsPanel({
  intakeFields,
}: {
  intakeFields: Array<{ id?: string; label?: string } | undefined>
}) {
  const [open, setOpen] = React.useState(false)
  const fieldIds = intakeFields
    .map((f) => f?.id)
    .filter((id): id is string => Boolean(id))

  return (
    <div className="rounded-xl border border-dashed">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground"
      >
        <span>Comandos disponibles para el texto</span>
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t px-3 pb-3 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Escribí comandos en el texto de arriba. El cliente verá los valores
            calculados con sus datos. Podés combinar con aritmética:{" "}
            <code className="rounded bg-muted px-1">/tdee - 500</code>
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Fórmulas predeterminadas
            </span>
            {Object.entries(PREDEFINED_COMMANDS).map(([, cmd]) => (
              <div key={cmd.label} className="flex flex-col gap-0.5">
                <code className="text-xs font-semibold text-primary">{cmd.label}</code>
                <span className="text-[11px] text-muted-foreground">{cmd.description}</span>
              </div>
            ))}
          </div>
          {fieldIds.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Variables del formulario del cliente
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fieldIds.map((id) => (
                  <code
                    key={id}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground"
                  >
                    /{id}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  productType: ProductType
  program?: CoachingProgram
  plan?: CoachingPlan | null
  content?: CoachingProgramContent | null
  routineTemplate?: import("@/lib/supabase/types").CoachRoutineTemplate | null
}

export function ProductForm({ productType, program, plan, content, routineTemplate }: Props) {
  const isEdit = Boolean(program)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  // qué rutinas están expandidas en el builder
  const [expandedRoutines, setExpandedRoutines] = React.useState<Set<number>>(new Set([0]))

  const existingPerks = plan ? readPerks(plan.perks) : null
  const typeLabel = PRODUCT_TYPE_LABELS[productType]

  // Convertir template existente al nuevo formato multi-rutina
  const existingRoutinePayload = readRoutineTemplatePayload(routineTemplate?.payload)
  let defaultRoutines: ProductValues["routines"] = []
  let defaultPlanning: ProductValues["routinePlanning"] = []
  if (existingRoutinePayload) {
    if (existingRoutinePayload.mode === "multi_adaptive") {
      defaultRoutines = existingRoutinePayload.routines.map((r) => ({
        name: r.name,
        groups: r.groups.map((g) => ({
          muscleGroup: g.muscleGroup,
          exerciseCount: g.exerciseCount,
          sets: g.sets,
          notes: g.notes ?? "",
        })),
      }))
      defaultPlanning = existingRoutinePayload.planning
    } else if (existingRoutinePayload.mode === "adaptive") {
      // Migrar formato viejo (un solo adaptive) al nuevo
      defaultRoutines = [
        {
          name: routineTemplate?.name ?? "Rutina principal",
          groups: existingRoutinePayload.groups.map((g) => ({
            muscleGroup: g.muscleGroup,
            exerciseCount: g.exerciseCount,
            sets: g.sets,
            notes: g.notes ?? "",
          })),
        },
      ]
    }
  }

  // Leer categorías del programa existente (formato viejo o nuevo)
  const existingCategories = program?.category
    ? readCategories(program.category)
    : []

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productType,
      title: program?.title ?? "",
      slug: program?.slug ?? "",
      tagline: program?.tagline ?? "",
      shortDescription: program?.short_description ?? "",
      description: program?.description ?? "",
      categories: existingCategories.length > 0 ? existingCategories : undefined,
      level: program?.level ?? undefined,
      coverUrl: program?.cover_url ?? "",
      introVideoUrl: program?.intro_video_url ?? "",
      includes: readIncludes(program?.includes).map((value) => ({ value })),
      faq: readFaq(program?.faq),
      price: plan ? plan.price_cents / 100 : undefined,
      priceUsd: plan?.price_usd_cents != null ? plan.price_usd_cents / 100 : undefined,
      discountPct: plan?.discount_pct ? plan.discount_pct : undefined,
      accentColor: plan?.accent_color ?? "",
      durationDays: plan?.duration_days ?? 30,
      chatEnabled: existingPerks?.chat.enabled ?? false,
      videoCallsCount: existingPerks?.video_calls.count ?? 0,
      videoCallMinutes: existingPerks?.video_calls.minutes ?? 0,
      routineMode: existingPerks?.routine.enabled
        ? (existingPerks.routine.mode ?? "adaptive")
        : "none",
      routineReconfigs: existingPerks?.routine.reconfigs_included ?? 0,
      routines: defaultRoutines,
      routinePlanning: defaultPlanning,
      supplementsEnabled: existingPerks?.supplements.enabled ?? false,
      progressSharingEnabled: existingPerks?.progress_sharing.enabled ?? false,
      content: readContentBlocks(content?.content)
        .filter((b) => b.type === "text")
        .map((b) => ({
          type: "text" as const,
          title: b.title ?? "",
          body: b.body ?? "",
        })),
      nutritionNotes: content?.nutrition_notes ?? "",
      intakeForm: readIntakeForm(content?.intake_form),
    },
  })

  const includes = useFieldArray({ control: form.control, name: "includes" })
  const faq = useFieldArray({ control: form.control, name: "faq" })
  const textBlocks = useFieldArray({ control: form.control, name: "content" })
  const intake = useFieldArray({ control: form.control, name: "intakeForm" })
  const routinesList = useFieldArray({ control: form.control, name: "routines" })
  const planningList = useFieldArray({ control: form.control, name: "routinePlanning" })
  const w = useWatch({ control: form.control })

  const slugEdited = React.useRef(isEdit)
  const title = useWatch({ control: form.control, name: "title" })
  React.useEffect(() => {
    if (!slugEdited.current && title) {
      form.setValue("slug", slugify(title))
    }
  }, [title, form])

  function toggle(field: keyof ProductValues) {
    form.setValue(field, !form.getValues(field) as never, { shouldDirty: true })
  }

  function toggleCategory(cat: ProductValues["categories"][number]) {
    const current = form.getValues("categories") ?? []
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat]
    form.setValue("categories", next as ProductValues["categories"], { shouldDirty: true })
  }

  function toggleRoutineExpanded(idx: number) {
    setExpandedRoutines((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function addFormulaFields() {
    const existing = form.getValues("intakeForm")
    const existingIds = new Set(existing.map((f) => f.id))
    const toAdd = FORMULA_INTAKE_FIELDS.filter((f) => !existingIds.has(f.id))
    if (toAdd.length === 0) {
      toast.info("Los campos ya están agregados")
      return
    }
    toAdd.forEach((f) =>
      intake.append({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options,
      })
    )
  }

  function onSubmit(values: ProductValues) {
    startTransition(async () => {
      const res = isEdit
        ? await updateProductAction(
            program!.id,
            plan?.id ?? null,
            routineTemplate?.id ?? null,
            values
          )
        : await createProductAction(values)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? "Producto actualizado" : "Producto creado")
      if (isEdit) {
        router.push(`/coach/programs/${program!.id}`)
        router.refresh()
      }
    })
  }

  const selectedCategories = w.categories ?? []
  const discountPct = w.discountPct ?? 0
  const price = w.price ?? 0
  const discountedPrice = discountPct > 0 ? price * (1 - discountPct / 100) : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5 pb-28">
          {/* ============================= EXPOSICIÓN ============================= */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Exposición del producto
            </h2>
            <Badge variant="secondary" className="text-[11px]">
              {typeLabel}
            </Badge>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-1.5">
                <ContentSlot
                  icon={ImageIcon}
                  title="Imagen de portada"
                  description="Subí una imagen desde tu dispositivo"
                />
                <TextField
                  name="coverUrl"
                  label="…o pegá una URL de imagen"
                  placeholder="https://…"
                />
              </div>
              <TextField
                name="title"
                label="Título"
                placeholder="Ej: Programa Base 12 semanas"
              />
              <div onInput={() => (slugEdited.current = true)}>
                <TextField name="slug" label="Slug (URL)" placeholder="programa-base" />
              </div>
              <TextField
                name="tagline"
                label="Gancho"
                placeholder="Ej: Construí tu mejor versión"
              />
              <TextAreaField
                name="shortDescription"
                label="Descripción corta"
                placeholder="Una o dos líneas que se ven en la tarjeta…"
              />
              <TextAreaField
                name="description"
                label="Descripción larga"
                placeholder={'El detalle completo que se ve al tocar "Ver detalle"…'}
              />
            </CardContent>
          </Card>

          {/* Categorías (multi-select) + Nivel */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Categorías</p>
                <div className="flex flex-wrap gap-2">
                  {COACHING_CATEGORY_OPTIONS.map((opt) => {
                    const active = selectedCategories.includes(
                      opt.value as ProductValues["categories"][number]
                    )
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          toggleCategory(opt.value as ProductValues["categories"][number])
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                {form.formState.errors.categories && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.categories.message ??
                      "Seleccioná al menos una categoría"}
                  </p>
                )}
              </div>
              <SelectField
                name="level"
                label="Nivel"
                options={COACHING_LEVEL_OPTIONS}
              />
              <div className="flex flex-col gap-1.5">
                <TextField
                  name="introVideoUrl"
                  label="URL de video intro (opcional)"
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Enlace de YouTube. La miniatura la toma del propio video (16:9).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist (qué incluye) */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Checklist (qué incluye)</p>
                <p className="text-xs text-muted-foreground">
                  Bullets cortos que resumen tu oferta. Aparecen en la tarjeta.
                </p>
              </div>
              {includes.fields.map((f, i) => (
                <div key={f.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <TextField
                      name={`includes.${i}.value`}
                      label=""
                      placeholder="Ej: Rutina adaptativa de 3-4 días"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 shrink-0 text-muted-foreground"
                    onClick={() => includes.remove(i)}
                    aria-label="Quitar"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => includes.append({ value: "" })}
              >
                <Plus className="size-4" /> Agregar ítem
              </Button>
            </CardContent>
          </Card>

          {/* Precio y duración */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm font-medium">Precio y duración</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField name="price" label="Precio (ARS)" min={0} />
                <NumberField name="durationDays" label="Duración (días)" min={1} />
              </div>
              <NumberField
                name="priceUsd"
                label="Precio en USD (opcional)"
                placeholder="Para mostrar doble moneda"
                min={0}
              />

              {/* Descuento */}
              <div className="flex flex-col gap-1.5">
                <NumberField
                  name="discountPct"
                  label="Descuento (%)"
                  placeholder="Ej: 20"
                  min={0}
                  max={99}
                />
                {discountPct > 0 && price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Precio final:{" "}
                    <span className="font-medium text-foreground">
                      ${discountedPrice!.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </span>{" "}
                    <span className="line-through">
                      ${price.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </span>
                  </p>
                )}
              </div>

              {/* Color de acento de la tarjeta */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Color de la tarjeta de precio</p>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((c) => {
                    const active = (w.accentColor ?? "") === c.value
                    return (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() =>
                          form.setValue("accentColor", c.value, { shouldDirty: true })
                        }
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                          active ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={
                          c.value
                            ? { backgroundColor: c.value }
                            : { backgroundColor: "var(--muted)" }
                        }
                        aria-label={c.label}
                      >
                        {!c.value && (
                          <X className="size-3 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ del producto */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Preguntas frecuentes</p>
                <p className="text-xs text-muted-foreground">
                  Resolvé las dudas que frenan la compra.
                </p>
              </div>
              {faq.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col gap-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pregunta {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => faq.remove(i)}
                      aria-label="Quitar pregunta"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <TextField
                    name={`faq.${i}.question`}
                    label=""
                    placeholder="¿Cuándo veo resultados?"
                  />
                  <TextAreaField
                    name={`faq.${i}.answer`}
                    label=""
                    placeholder="Respuesta…"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => faq.append({ question: "", answer: "" })}
              >
                <Plus className="size-4" /> Agregar pregunta
              </Button>
            </CardContent>
          </Card>

          {/* ============================= CONTENIDO ============================= */}
          <div className="flex items-center gap-2 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contenido {typeLabel === "Asesoría" ? "de la asesoría" : "del plan"}
            </h2>
          </div>

          {/* Perks */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Acompañamiento incluido</p>

            <PerkRow
              icon={MessageCircle}
              title="Chat con el coach"
              description="Mensajería directa mientras dure"
              enabled={w.chatEnabled ?? false}
              onToggle={() => toggle("chatEnabled")}
            />

            <PerkRow
              icon={Video}
              title="Videollamadas"
              description="Sesiones de seguimiento por video"
              enabled={(w.videoCallsCount ?? 0) > 0}
              onToggle={() =>
                form.setValue(
                  "videoCallsCount",
                  (w.videoCallsCount ?? 0) > 0 ? 0 : 2,
                  { shouldDirty: true }
                )
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <NumberField name="videoCallsCount" label="Cantidad" min={0} max={100} />
                <NumberField name="videoCallMinutes" label="Min. c/u" min={0} max={240} />
              </div>
            </PerkRow>

            {/* Selector de tipo de rutina */}
            <div className="flex flex-col gap-3 rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    w.routineMode !== "none"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Dumbbell className="size-4" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">Rutinas</span>
                  <span className="text-xs text-muted-foreground">
                    Acceso del cliente a rutinas de entrenamiento
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "adaptive" as const,
                      label: "Adaptativa",
                      desc: "El cliente elige sus ejercicios por grupo muscular",
                    },
                    {
                      value: "personalized" as const,
                      label: "Personalizada",
                      desc: "El coach crea una rutina a medida por cliente",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "routineMode",
                        w.routineMode === opt.value ? "none" : opt.value,
                        { shouldDirty: true }
                      )
                    }
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors",
                      w.routineMode === opt.value
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-[11px] leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {w.routineMode !== "none" && (
                <NumberField
                  name="routineReconfigs"
                  label="Reconfiguraciones incluidas"
                  min={0}
                  max={52}
                />
              )}
            </div>

            <PerkRow
              icon={Pill}
              title="Plan de suplementación"
              description="Guía de suplementos personalizada"
              enabled={w.supplementsEnabled ?? false}
              onToggle={() => toggle("supplementsEnabled")}
            />

            <PerkRow
              icon={LineChart}
              title="Seguimiento de progreso"
              description="El coach ve tu progreso para ajustar"
              enabled={w.progressSharingEnabled ?? false}
              onToggle={() => toggle("progressSharingEnabled")}
            />
          </div>

          {/* Builder de rutinas adaptativas */}
          {w.routineMode === "adaptive" && (
            <Card>
              <CardContent className="flex flex-col gap-5 pt-6">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Rutinas adaptativas</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Definí cuántos ejercicios y series por músculo en cada rutina.
                  El cliente elegirá los ejercicios concretos al comprar.
                </p>

                {/* Lista de rutinas */}
                <div className="flex flex-col gap-3">
                  {routinesList.fields.map((routineField, ri) => {
                    const isExpanded = expandedRoutines.has(ri)
                    return (
                      <div
                        key={routineField.id}
                        className="flex flex-col rounded-xl border bg-background/40"
                      >
                        {/* Cabecera de rutina */}
                        <div className="flex items-center gap-2 p-3">
                          <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                          <input
                            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                            placeholder={`Rutina ${ri + 1}`}
                            {...form.register(`routines.${ri}.name`)}
                          />
                          <button
                            type="button"
                            onClick={() => toggleRoutineExpanded(ri)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground"
                            onClick={() => {
                              routinesList.remove(ri)
                              setExpandedRoutines((prev) => {
                                const next = new Set<number>()
                                prev.forEach((idx) => {
                                  if (idx < ri) next.add(idx)
                                  else if (idx > ri) next.add(idx - 1)
                                })
                                return next
                              })
                            }}
                            aria-label="Quitar rutina"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>

                        {/* Cuerpo expandible */}
                        {isExpanded && (
                          <div className="flex flex-col gap-3 border-t px-3 pb-3 pt-3">
                            <GroupsForRoutine
                              routineIndex={ri}
                              form={form}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    const newIdx = routinesList.fields.length
                    routinesList.append({ name: "", groups: [] })
                    setExpandedRoutines((prev) => new Set([...prev, newIdx]))
                  }}
                >
                  <Plus className="size-4" /> Agregar rutina
                </Button>

                {/* Planificación */}
                {routinesList.fields.length > 0 && (
                  <>
                    <div className="flex flex-col gap-0.5 pt-2">
                      <p className="text-sm font-medium">Planificación</p>
                      <p className="text-xs text-muted-foreground">
                        Asignale una rutina a cada día o bloque del programa.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {planningList.fields.map((pField, pi) => {
                        const routineOptions = (w.routines ?? []).map((r, idx) => ({
                          value: String(idx),
                          label: (r.name ?? "").trim() || `Rutina ${idx + 1}`,
                        }))
                        return (
                          <div
                            key={pField.id}
                            className="flex items-end gap-2 rounded-xl border bg-background/40 p-3"
                          >
                            <div className="flex-1">
                              <TextField
                                name={`routinePlanning.${pi}.label`}
                                label="Día / bloque"
                                placeholder="Ej: Lunes, Día 1…"
                              />
                            </div>
                            <div className="w-40 shrink-0">
                              <SelectField
                                name={`routinePlanning.${pi}.routineIndex`}
                                label="Rutina"
                                options={routineOptions}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mb-0.5 shrink-0 text-muted-foreground"
                              onClick={() => planningList.remove(pi)}
                              aria-label="Quitar día"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() =>
                          planningList.append({ label: "", routineIndex: 0 })
                        }
                      >
                        <Plus className="size-4" /> Agregar día
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info rutina personalizada */}
          {w.routineMode === "personalized" && (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-6 pb-5">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Rutina personalizada</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuando un cliente se suscriba a esta asesoría, encontrarás
                  la opción de crearle su rutina y planificación a medida
                  dentro de su ficha en la sección{" "}
                  <span className="font-medium text-foreground">Clientes</span>.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Material entregable: bloques de texto */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Bloques de texto</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Notas, explicaciones y guías escritas que recibe el cliente.
              </p>
              {textBlocks.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col gap-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Bloque {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => textBlocks.remove(i)}
                      aria-label="Quitar bloque"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <TextField
                    name={`content.${i}.title`}
                    label=""
                    placeholder="Título (opcional)"
                  />
                  <TextAreaField
                    name={`content.${i}.body`}
                    label=""
                    placeholder="Escribí el contenido…"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  textBlocks.append({ type: "text", title: "", body: "" })
                }
              >
                <Plus className="size-4" /> Agregar bloque
              </Button>
            </CardContent>
          </Card>

          {/* Nutrición / planificación */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2">
                <Apple className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Nutrición y planificación</p>
              </div>
              <TextAreaField
                name="nutritionNotes"
                label=""
                placeholder="Pautas de alimentación, planificación general…"
              />
              <NutritionCommandsPanel intakeFields={w.intakeForm ?? []} />
              <ContentSlot
                icon={FileUp}
                title="Adjuntar documento"
                description="PDF de dieta o planificación"
              />
            </CardContent>
          </Card>

          {/* Material multimedia */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="text-sm font-medium">Material multimedia</p>
              <ContentSlot icon={Mic} title="Audios" description="Mensajes de voz o guías en audio" />
              <ContentSlot icon={ImageIcon} title="Imágenes" description="Infografías, ejemplos de técnica" />
              <ContentSlot icon={FileUp} title="Documentos" description="PDF de rutina, etc." />
              <ContentSlot icon={Film} title="Videos" description="Demostraciones y clases" />
              <ContentSlot
                icon={CalendarRange}
                title="PDF de rutina"
                description="Adjuntá un archivo de planificación"
              />
            </CardContent>
          </Card>

          {/* Formulario para el cliente */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Formulario para el cliente</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Datos que el cliente completa después de comprar (para que armes
                su plan).
              </p>
              {intake.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col gap-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Campo {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => intake.remove(i)}
                      aria-label="Quitar campo"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <TextField
                    name={`intakeForm.${i}.label`}
                    label=""
                    placeholder="Ej: ¿Tenés alguna lesión?"
                  />
                  <div className="grid grid-cols-2 items-end gap-3">
                    <SelectField
                      name={`intakeForm.${i}.type`}
                      label="Tipo"
                      options={INTAKE_FIELD_TYPE_OPTIONS}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          `intakeForm.${i}.required`,
                          !form.getValues(`intakeForm.${i}.required`),
                          { shouldDirty: true }
                        )
                      }
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      Obligatorio
                      <span
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          w.intakeForm?.[i]?.required ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                            w.intakeForm?.[i]?.required
                              ? "translate-x-[18px]"
                              : "translate-x-0.5"
                          )}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    intake.append({
                      id: crypto.randomUUID(),
                      label: "",
                      type: "text",
                      required: false,
                    })
                  }
                >
                  <Plus className="size-4" /> Agregar campo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFormulaFields}
                >
                  <Apple className="size-4" /> Campos para /tmb y /tdee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4 py-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-base"
              disabled={isPending}
            >
              {isPending
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : `Crear ${typeLabel.toLowerCase()}`}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

/**
 * Subcomponente para los grupos musculares de una rutina.
 * Separado para mantener el form principal limpio.
 */
function GroupsForRoutine({
  routineIndex,
  form,
}: {
  routineIndex: number
  form: ReturnType<typeof useForm<ProductValues>>
}) {
  const groups = useFieldArray({
    control: form.control,
    name: `routines.${routineIndex}.groups`,
  })

  return (
    <>
      {groups.fields.map((gf, gi) => (
        <div
          key={gf.id}
          className="flex flex-col gap-3 rounded-xl border bg-background/60 p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <SelectField
                name={`routines.${routineIndex}.groups.${gi}.muscleGroup`}
                label="Grupo muscular"
                options={MUSCLE_GROUP_OPTIONS}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0 text-muted-foreground"
              onClick={() => groups.remove(gi)}
              aria-label="Quitar grupo"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              name={`routines.${routineIndex}.groups.${gi}.exerciseCount`}
              label="N° ejercicios"
              min={1}
              max={10}
            />
            <NumberField
              name={`routines.${routineIndex}.groups.${gi}.sets`}
              label="Series c/u"
              min={1}
              max={20}
            />
          </div>
          <TextField
            name={`routines.${routineIndex}.groups.${gi}.notes`}
            label="Notas"
            placeholder="Opcional"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          groups.append({ muscleGroup: "", exerciseCount: 3, sets: 3, notes: "" })
        }
      >
        <Plus className="size-4" /> Agregar músculo
      </Button>
    </>
  )
}
