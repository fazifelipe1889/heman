"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveCoachNotesAction } from "./actions"

export function CoachNotesForm({
  subscriptionId,
  initialNotes,
}: {
  subscriptionId: string
  initialNotes: string
}) {
  const [notes, setNotes] = React.useState(initialNotes)
  const [isPending, startTransition] = React.useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await saveCoachNotesAction({ subscriptionId, notes })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Notas guardadas")
    })
  }

  const dirty = notes !== initialNotes

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas privadas sobre este cliente (solo las ves vos)…"
        rows={4}
      />
      <Button
        size="sm"
        className="self-end"
        disabled={isPending || !dirty}
        onClick={handleSave}
      >
        {isPending ? "Guardando…" : "Guardar notas"}
      </Button>
    </div>
  )
}
