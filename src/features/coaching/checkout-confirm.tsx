"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { activateSubscriptionManuallyAction } from "./checkout-actions"

export function CheckoutConfirm({ planId }: { planId: string }) {
  const [isPending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const res = await activateSubscriptionManuallyAction(planId)
      // Si tiene éxito, la action redirige; si vuelve, hubo error.
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        className="h-12 w-full text-base"
        disabled={isPending}
        onClick={handleConfirm}
      >
        {isPending ? "Activando…" : "Confirmar y activar"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Activación de prueba — la pasarela de pago real se integra próximamente.
      </p>
    </div>
  )
}
