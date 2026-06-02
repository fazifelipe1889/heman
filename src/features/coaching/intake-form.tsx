"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { IntakeField, IntakeAnswers } from "@/lib/domain/coaching"
import { saveIntakeAnswersAction } from "./actions"

export function IntakeForm({
  subscriptionId,
  fields,
  initialAnswers,
}: {
  subscriptionId: string
  fields: IntakeField[]
  initialAnswers: IntakeAnswers
}) {
  const router = useRouter()
  const [answers, setAnswers] = React.useState<IntakeAnswers>(initialAnswers)
  const [isPending, startTransition] = React.useTransition()

  function setValue(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function handleSubmit() {
    // Validar requeridos.
    const missing = fields.find(
      (f) => f.required && !(answers[f.id]?.trim())
    )
    if (missing) {
      toast.error(`Completá: ${missing.label}`)
      return
    }
    startTransition(async () => {
      const res = await saveIntakeAnswersAction({ subscriptionId, answers })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("¡Datos enviados!")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              value={answers[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              type={field.type === "number" ? "number" : "text"}
              value={answers[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
            />
          )}
        </div>
      ))}
      <Button disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Enviando…" : "Enviar datos"}
      </Button>
    </div>
  )
}
