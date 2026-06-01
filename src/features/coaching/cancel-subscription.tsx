"use client"

import * as React from "react"
import { toast } from "sonner"

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
import { cancelSubscriptionAction } from "./actions"

export function CancelSubscription({
  subscriptionId,
  coachName,
}: {
  subscriptionId: string
  coachName: string
}) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelSubscriptionAction(subscriptionId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setOpen(false)
      toast.success("Asesoría cancelada. Ya podés contratar otra.")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
          />
        }
      >
        Cancelar asesoría
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar tu asesoría?</DialogTitle>
          <DialogDescription>
            Vas a finalizar tu asesoría con {coachName}. Perderás el acceso al
            chat y a los beneficios del plan. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Volver</DialogClose>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelando…" : "Sí, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
