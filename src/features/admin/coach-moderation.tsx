"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CoachStatus } from "@/lib/domain/coaching"
import { moderateCoachAction } from "./actions"

export function CoachModerationActions({
  coachId,
  status,
}: {
  coachId: string
  status: CoachStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function run(next: CoachStatus, label: string) {
    startTransition(async () => {
      const res = await moderateCoachAction(coachId, next)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(label)
      router.refresh()
    })
  }

  if (status === "pending_review") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run("active", "Coach aprobado")}
        >
          <Check className="size-4" /> Aprobar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => run("rejected", "Coach rechazado")}
        >
          <X className="size-4" /> Rechazar
        </Button>
      </div>
    )
  }

  if (status === "active") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => run("suspended", "Coach suspendido")}
      >
        Suspender
      </Button>
    )
  }

  // suspended / rejected → permitir reactivar
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => run("active", "Coach reactivado")}
    >
      Reactivar
    </Button>
  )
}
