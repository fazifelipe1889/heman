"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { TextField, TextAreaField } from "@/features/routines/fields"
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
      ...socialsToValues(coach),
    },
  })

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
              <TextField
                name="avatarUrl"
                label="URL de avatar"
                placeholder="https://…"
              />
              <TextField
                name="coverUrl"
                label="URL de portada"
                placeholder="https://…"
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
