"use client"

import * as React from "react"
import { useForm, useWatch, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

import {
  COACHING_CATEGORY_OPTIONS,
  COACHING_LEVEL_OPTIONS,
} from "@/lib/domain/labels"
import { readFaq, readIncludes } from "@/lib/domain/coaching"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import {
  TextField,
  TextAreaField,
  SelectField,
} from "@/features/routines/fields"
import type { CoachingProgram } from "@/lib/supabase/types"
import { createProgramAction, updateProgramAction } from "./actions"
import { programSchema, type ProgramValues } from "./schema"

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

type Props = {
  program?: CoachingProgram
}

export function ProgramForm({ program }: Props) {
  const isEdit = Boolean(program)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<ProgramValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: program?.title ?? "",
      slug: program?.slug ?? "",
      tagline: program?.tagline ?? "",
      description: program?.description ?? "",
      category: program?.category ?? undefined,
      level: program?.level ?? undefined,
      coverUrl: program?.cover_url ?? "",
      introVideoUrl: program?.intro_video_url ?? "",
      includes: readIncludes(program?.includes).map((value) => ({ value })),
      faq: readFaq(program?.faq),
    },
  })

  const includes = useFieldArray({ control: form.control, name: "includes" })
  const faq = useFieldArray({ control: form.control, name: "faq" })

  // Autogenerar slug desde el título mientras no se haya editado a mano (solo en alta).
  const slugEdited = React.useRef(isEdit)
  const title = useWatch({ control: form.control, name: "title" })
  React.useEffect(() => {
    if (!slugEdited.current && title) {
      form.setValue("slug", slugify(title))
    }
  }, [title, form])

  function onSubmit(values: ProgramValues) {
    startTransition(async () => {
      const res = isEdit
        ? await updateProgramAction(program!.id, values)
        : await createProgramAction(values)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (isEdit) toast.success("Asesoría actualizada")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5 pb-28">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="title"
                label="Título"
                placeholder="Ej: Plan de hipertrofia 12 semanas"
              />
              <div onInput={() => (slugEdited.current = true)}>
                <TextField
                  name="slug"
                  label="Slug (URL)"
                  placeholder="plan-hipertrofia"
                />
              </div>
              <TextField
                name="tagline"
                label="Frase gancho"
                placeholder="Ej: Ganá masa muscular con un plan a medida"
              />
              <TextAreaField
                name="description"
                label="Descripción"
                placeholder="Qué incluye, a quién va dirigido, metodología…"
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
              <TextField
                name="coverUrl"
                label="URL de portada (opcional)"
                placeholder="https://…"
              />
              <TextField
                name="introVideoUrl"
                label="URL de video intro (opcional)"
                placeholder="https://…"
              />
            </CardContent>
          </Card>

          {/* Qué incluye (bullets de venta) */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Qué incluye</p>
                <p className="text-xs text-muted-foreground">
                  Bullets cortos que resumen tu oferta. Aparecen en la landing.
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
                <Plus className="size-4" /> Agregar bullet
              </Button>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Preguntas frecuentes</p>
                <p className="text-xs text-muted-foreground">
                  Resolvé las dudas que frenan la compra.
                </p>
              </div>
              {faq.fields.map((f, i) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-xl border p-3"
                >
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
                  : "Crear asesoría"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
