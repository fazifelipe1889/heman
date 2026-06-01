"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { TextField, TextAreaField } from "@/features/routines/fields"
import type { CoachingTransformation } from "@/lib/supabase/types"
import {
  createTransformationAction,
  updateTransformationAction,
} from "./actions"
import { transformationSchema, type TransformationValues } from "./schema"

type Props = {
  programId: string
  transformation?: CoachingTransformation
}

export function TransformationForm({ programId, transformation }: Props) {
  const isEdit = Boolean(transformation)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<TransformationValues>({
    resolver: zodResolver(transformationSchema),
    defaultValues: {
      clientName: transformation?.client_name ?? "",
      beforeUrl: transformation?.before_url ?? "",
      afterUrl: transformation?.after_url ?? "",
      metric: transformation?.metric ?? "",
      testimonial: transformation?.testimonial ?? "",
    },
  })

  function onSubmit(values: TransformationValues) {
    startTransition(async () => {
      const res = isEdit
        ? await updateTransformationAction(transformation!.id, programId, values)
        : await createTransformationAction(programId, values)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? "Transformación actualizada" : "Transformación agregada")
      router.push(`/coach/programs/${programId}`)
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5 pb-28">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="clientName"
                label="Nombre del cliente"
                placeholder="Ej: Isidro"
              />
              <TextField
                name="metric"
                label="Resultado destacado"
                placeholder="Ej: +15 kg de masa muscular · 48 semanas"
              />
              <TextAreaField
                name="testimonial"
                label="Testimonio (opcional)"
                placeholder="Qué dice el cliente sobre su experiencia…"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <TextField
                name="beforeUrl"
                label="Foto «antes» (URL)"
                placeholder="https://…"
              />
              <TextField
                name="afterUrl"
                label="Foto «después» (URL)"
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Subí las fotos a un hosting y pegá los enlaces. Idealmente con el
                mismo encuadre para que el antes/después se note.
              </p>
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
                  : "Agregar transformación"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
