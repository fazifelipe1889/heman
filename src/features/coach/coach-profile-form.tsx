"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { TextField, TextAreaField } from "@/features/routines/fields"
import { readFaq } from "@/lib/domain/coaching"
import type { CoachProfile } from "@/lib/supabase/types"
import { applyAsCoachAction, updateCoachProfileAction } from "./actions"
import { coachProfileSchema, type CoachProfileValues } from "./schema"

type Props = {
  /** Si se pasa, el form opera en modo edición. */
  coach?: CoachProfile
}

function socialsToValues(coach?: CoachProfile) {
  const s = (coach?.socials ?? {}) as Record<string, string>
  return {
    instagram: s.instagram ?? "",
    youtube: s.youtube ?? "",
    tiktok: s.tiktok ?? "",
  }
}

export function CoachProfileForm({ coach }: Props) {
  const isEdit = Boolean(coach)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<CoachProfileValues>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      handle: coach?.handle ?? "",
      displayName: coach?.display_name ?? "",
      headline: coach?.headline ?? "",
      bio: coach?.bio ?? "",
      avatarUrl: coach?.avatar_url ?? "",
      coverUrl: coach?.cover_url ?? "",
      location: coach?.location ?? "",
      publicEmail: coach?.public_email ?? "",
      faq: readFaq(coach?.faq),
      ...socialsToValues(coach),
    },
  })

  const faq = useFieldArray({ control: form.control, name: "faq" })

  function onSubmit(values: CoachProfileValues) {
    startTransition(async () => {
      const res = isEdit
        ? await updateCoachProfileAction(values)
        : await applyAsCoachAction(values)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (isEdit) toast.success("Perfil actualizado")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5 pb-28">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="handle"
                label="@handle (URL pública)"
                placeholder="tu-nombre"
              />
              <TextField
                name="displayName"
                label="Nombre público"
                placeholder="Ej: Juan Pérez"
              />
              <TextField
                name="headline"
                label="Titular"
                placeholder="Ej: Coach de fuerza · 8 años de experiencia"
              />
              <TextAreaField
                name="bio"
                label="Bio"
                placeholder="Contá tu experiencia, certificaciones y enfoque…"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm font-medium">Imágenes (opcional)</p>
              <div className="flex flex-col gap-1.5">
                <TextField
                  name="avatarUrl"
                  label="URL de foto de perfil"
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Cuadrada (1:1). Recomendado: 400×400 px.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <TextField
                  name="coverUrl"
                  label="URL de portada"
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Apaisada (3:1). Recomendado: 1200×400 px.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm font-medium">Ubicación y contacto</p>
              <TextField
                name="location"
                label="Ubicación aproximada"
                placeholder="Ej: Buenos Aires, Argentina"
              />
              <TextField
                name="publicEmail"
                label="Email de contacto (público)"
                placeholder="hola@tucoaching.com"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm font-medium">Redes (opcional)</p>
              <TextField name="instagram" label="Instagram" placeholder="@usuario" />
              <TextField name="youtube" label="YouTube" placeholder="@canal" />
              <TextField name="tiktok" label="TikTok" placeholder="@usuario" />
            </CardContent>
          </Card>

          {/* FAQ del coach */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Preguntas frecuentes</p>
                <p className="text-xs text-muted-foreground">
                  Se muestran en tu perfil público, debajo de las reseñas.
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
                    placeholder="¿Cómo es el seguimiento?"
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
                  : "Enviar solicitud"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
