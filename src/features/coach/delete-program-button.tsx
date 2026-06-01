"use client"

import * as React from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteProgramAction } from "./actions"

export function DeleteProgramButton({ programId }: { programId: string }) {
  const [isPending, startTransition] = React.useTransition()
  const [open, setOpen] = React.useState(false)

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProgramAction(programId)
        // deleteProgramAction redirige; si no, cerramos.
      } catch {
        toast.error("No se pudo eliminar la asesoría.")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="size-4" /> Eliminar asesoría
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta asesoría?</DialogTitle>
          <DialogDescription>
            Se eliminarán también sus planes. Esta acción no se puede deshacer.
            Las suscripciones existentes no se borran.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
