"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Star, Trash2 } from "lucide-react"

import { deleteRoutineAction, setFavoriteAction } from "./actions"

export function RoutineListActions({
  id,
  isFavorite,
}: {
  id: string
  isFavorite: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      onClick={(e) => e.preventDefault()} // evitar navegar al hacer clic en los botones
    >
      <button
        type="button"
        aria-label={isFavorite ? "Quitar favorito" : "Marcar favorito"}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setFavoriteAction(id, !isFavorite)
            router.refresh()
          })
        }
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        <Star
          className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
        />
      </button>

      <button
        type="button"
        aria-label="Eliminar rutina"
        disabled={isPending}
        onClick={() => {
          if (!confirm("¿Eliminar esta rutina? No se puede deshacer.")) return
          startTransition(() => deleteRoutineAction(id))
        }}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
