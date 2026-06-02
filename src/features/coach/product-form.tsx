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
  ROUTINE_MODES,
} from "@/lib/domain/coaching"
import type { ProductType } from "@/lib/domain/coaching"
import { ExercisePicker } from "@/features/exercises/exercise-picker"
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

/** Opciones de grupo muscular para el modo adaptativo. */
const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS_ES.map((g) => ({ value: g, label: g }))

/** Genera un slug a partir del título. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar diacríticos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/** Fila de perk con switch (compartida con el form de plan). */
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

/** Slot de contenido aún no configurable (placeholder de subida). */
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

type Props = {
  /** Tipo de producto (en alta viene del selector "+ Crear"; en edición, del producto). */
  productType: ProductType
  /** Modo edición: program existente + su plan (si lo tiene) + su contenido. */
  program?: CoachingProgram
  plan?: CoachingPlan | null
  content?: CoachingProgramContent | null
  /** Template de rutina existente (para edición). */
  routineTemplate?: import("@/lib/supabase/types").CoachRoutineTemplate | null
}

export function ProductForm({ productType, program, plan, content, routineTemplate }: Props) {
  const isEdit = Boolean(program)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const existingPerks = plan ? readPerks(plan.perks) : null
  const typeLabel = PRODUCT_TYPE_LABELS[productType]

  // Leer el payload del template de rutina existente.
  const existingRoutinePayload = readRoutineTemplatePayload(routineTemplate?.payload)

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productType,
      title: program?.title ?? "",
      slug: program?.slug ?? "",
      tagline: program?.tagline ?? "",
      shortDescription: program?.short_description ?? "",
      description: program?.description ?? "",
      category: program?.category ?? undefined,
      level: program?.level ?? undefined,
      coverUrl: program?.cover_url ?? "",
      introVideoUrl: program?.intro_video_url ?? "",
      includes: readIncludes(program?.includes).map((value) => ({ value })),
      faq: readFaq(program?.faq),
      price: plan ? plan.price_cents / 100 : undefined,
      priceUsd: plan?.price_usd_cents != null ? plan.price_usd_cents / 100 : undefined,
      durationDays: plan?.duration_days ?? 30,
      chatEnabled: existingPerks?.chat.enabled ?? false,
      videoCallsCount: existingPerks?.video_calls.count ?? 0,
      videoCallMinutes: existingPerks?.video_calls.minutes ?? 0,
      routineEnabled: existingPerks?.routine.enabled ?? false,
      routineReconfigs: existingPerks?.routine.reconfigs_included ?? 0,
      routineMode: existingRoutinePayload?.mode ?? "personalized",
      routineExercises:
        existingRoutinePayload?.mode === "personalized"
          ? existingRoutinePayload.exercises.map((e) => ({
              exerciseName: e.exerciseName,
              exerciseRef: e.exerciseRef ?? "",
              sets: e.sets,
              targetReps: e.targetReps ?? "",
              targetWeight: e.targetWeight ?? undefined,
              targetRir: e.targetRir ?? undefined,
              restSeconds: e.restSeconds ?? undefined,
              notes: e.notes ?? "",
            }))
          : [],
      routineGroups:
        existingRoutinePayload?.mode === "adaptive"
          ? existingRoutinePayload.groups.map((g) => ({
              muscleGroup: g.muscleGroup,
              exerciseCount: g.exerciseCount,
              sets: g.sets,
              notes: g.notes ?? "",
            }))
          : [],
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
  const routineExercises = useFieldArray({ control: form.control, name: "routineExercises" })
  const routineGroups = useFieldArray({ control: form.control, name: "routineGroups" })
  const w = useWatch({ control: form.control })

  // Autogenerar slug desde el título mientras no se haya editado a mano (solo en alta).
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
      // En alta la action redirige al detalle; solo llega acá si hubo error.
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
              {/* Imagen: slot de subida (placeholder) + URL como fallback */}
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
                placeholder="El detalle completo que se ve al tocar “Ver detalle”…"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  name="category"
                  label="Categoría"
                  options={COACHING_CATEGORY_OPTIONS}
                />
                <SelectField
                  name="level"
                  label="Nivel"
                  options={COACHING_LEVEL_OPTIONS}
                />
              </div>
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

          {/* Perks: qué acompañamiento incluye (más relevante para asesorías) */}
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

            <PerkRow
              icon={Dumbbell}
              title="Rutina personalizada"
              description="El coach asigna una rutina a medida"
              enabled={w.routineEnabled ?? false}
              onToggle={() => toggle("routineEnabled")}
            >
              <NumberField
                name="routineReconfigs"
                label="Reconfiguraciones incluidas"
                min={0}
                max={52}
              />
            </PerkRow>

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

          {/* Builder de rutina (solo si la rutina está activada) */}
          {w.routineEnabled && (
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Armado de la rutina</p>
                </div>

                {/* Selector de modo */}
                <div className="grid grid-cols-2 gap-2">
                  {ROUTINE_MODES.map((mode) => {
                    const active = (w.routineMode ?? "personalized") === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          form.setValue("routineMode", mode, { shouldDirty: true })
                        }
                        className={cn(
                          "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-sm font-medium">
                          {mode === "personalized" ? "Personalizada" : "Adaptativa"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {mode === "personalized"
                            ? "Vos definís los ejercicios exactos"
                            : "El cliente elige sus ejercicios por músculo"}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* MODO PERSONALIZADO: ejercicios exactos */}
                {(w.routineMode ?? "personalized") === "personalized" && (
                  <div className="flex flex-col gap-3">
                    {routineExercises.fields.map((f, i) => (
                      <div
                        key={f.id}
                        className="flex flex-col gap-3 rounded-xl border bg-background/40 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <ExercisePicker
                              value={w.routineExercises?.[i]?.exerciseName ?? ""}
                              onPick={(ex) => {
                                form.setValue(
                                  `routineExercises.${i}.exerciseName`,
                                  ex.name,
                                  { shouldDirty: true }
                                )
                                form.setValue(
                                  `routineExercises.${i}.exerciseRef`,
                                  ex.id
                                )
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-0.5 shrink-0 text-muted-foreground"
                            onClick={() => routineExercises.remove(i)}
                            aria-label="Quitar ejercicio"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <NumberField
                            name={`routineExercises.${i}.sets`}
                            label="Series"
                            min={1}
                            max={20}
                          />
                          <TextField
                            name={`routineExercises.${i}.targetReps`}
                            label="Reps"
                            placeholder="8-12"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <NumberField
                            name={`routineExercises.${i}.targetWeight`}
                            label="Peso (kg)"
                            min={0}
                            step="0.5"
                          />
                          <NumberField
                            name={`routineExercises.${i}.targetRir`}
                            label="RIR"
                            min={0}
                            max={10}
                          />
                          <NumberField
                            name={`routineExercises.${i}.restSeconds`}
                            label="Desc. (s)"
                            min={0}
                            max={900}
                          />
                        </div>
                        <TextField
                          name={`routineExercises.${i}.notes`}
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
                        routineExercises.append({
                          exerciseName: "",
                          exerciseRef: "",
                          sets: 3,
                          targetReps: "",
                          targetWeight: undefined,
                          targetRir: undefined,
                          restSeconds: undefined,
                          notes: "",
                        })
                      }
                    >
                      <Plus className="size-4" /> Agregar ejercicio
                    </Button>
                  </div>
                )}

                {/* MODO ADAPTATIVO: volumen por músculo */}
                {(w.routineMode ?? "personalized") === "adaptive" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      Definí cuántos ejercicios y series por músculo. El cliente
                      elegirá los ejercicios concretos después de comprar.
                    </p>
                    {routineGroups.fields.map((f, i) => (
                      <div
                        key={f.id}
                        className="flex flex-col gap-3 rounded-xl border bg-background/40 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <SelectField
                              name={`routineGroups.${i}.muscleGroup`}
                              label="Grupo muscular"
                              options={MUSCLE_GROUP_OPTIONS}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 shrink-0 text-muted-foreground"
                            onClick={() => routineGroups.remove(i)}
                            aria-label="Quitar grupo"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <NumberField
                            name={`routineGroups.${i}.exerciseCount`}
                            label="N° ejercicios"
                            min={1}
                            max={10}
                          />
                          <NumberField
                            name={`routineGroups.${i}.sets`}
                            label="Series c/u"
                            min={1}
                            max={20}
                          />
                        </div>
                        <TextField
                          name={`routineGroups.${i}.notes`}
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
                        routineGroups.append({
                          muscleGroup: "",
                          exerciseCount: 3,
                          sets: 3,
                          notes: "",
                        })
                      }
                    >
                      <Plus className="size-4" /> Agregar grupo muscular
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Material entregable: bloques de texto (funcional) */}
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

          {/* Nutrición / planificación (texto libre + adjuntos placeholder) */}
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
              <ContentSlot
                icon={FileUp}
                title="Adjuntar documento"
                description="PDF de dieta o planificación"
              />
            </CardContent>
          </Card>

          {/* Material multimedia (slots placeholder) */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="text-sm font-medium">Material multimedia</p>
              <ContentSlot icon={Mic} title="Audios" description="Mensajes de voz o guías en audio" />
              <ContentSlot icon={ImageIcon} title="Imágenes" description="Infografías, ejemplos de técnica" />
              <ContentSlot icon={FileUp} title="Documentos" description="PDF de rutina, etc." />
              <ContentSlot icon={Film} title="Videos" description="Demostraciones y clases" />
              <ContentSlot
                icon={CalendarRange}
                title="Rutina + planificación"
                description="Personalizada o adaptativa (próxima etapa)"
              />
            </CardContent>
          </Card>

          {/* Formulario para el cliente (funcional) */}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
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
