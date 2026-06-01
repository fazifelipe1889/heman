"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Globe, Archive, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CoachingProgramStatus } from "@/lib/domain/coaching"
import { setProgramStatusAction } from "./actions"

type Props = {
  programId: string
  status: CoachingProgramStatus
  /** Cantidad de planes visibles: no se puede publicar sin planes. */
  visiblePlanCount: number
}

export function ProgramStatusControl({ programId, status, visiblePlanCount }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function run(next: CoachingProgramStatus) {
    if (next === "published" && visiblePlanCount === 0) {
      toast.error("Agregá al menos un plan visible antes de publicar.")
      return
    }
    startTransition(async () => {
      const res = await setProgramStatusAction(programId, next)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(
        next === "published"
          ? "Asesoría publicada"
          : next === "archived"
            ? "Asesoría archivada"
            : "Asesoría despublicada"
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" ? (
        <Button size="sm" disabled={isPending} onClick={() => run("published")}>
          <Globe className="size-4" /> Publicar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run("draft")}
        >
          <Undo2 className="size-4" /> Despublicar
        </Button>
      )}
      {status !== "archived" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run("archived")}
        >
          <Archive className="size-4" /> Archivar
        </Button>
      )}
    </div>
  )
}
