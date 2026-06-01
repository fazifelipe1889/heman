"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deleteRoutineAction, setFavoriteAction } from "./actions"

export function RoutineActions({
  id,
  isFavorite,
}: {
  id: string
  isFavorite: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Marcar favorita"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setFavoriteAction(id, !isFavorite)
            router.refresh()
          })
        }
      >
        <Star
          className={isFavorite ? "size-5 fill-primary text-primary" : "size-5"}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Eliminar rutina"
        disabled={isPending}
        onClick={() => {
          if (confirm("¿Eliminar esta rutina? No se puede deshacer.")) {
            startTransition(() => deleteRoutineAction(id))
          }
        }}
      >
        <Trash2 className="size-5 text-muted-foreground" />
      </Button>
    </div>
  )
}
