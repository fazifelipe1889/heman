"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CoachingTransformation } from "@/lib/supabase/types"
import { deleteTransformationAction } from "./actions"

export function TransformationsList({
  programId,
  transformations,
}: {
  programId: string
  transformations: CoachingTransformation[]
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteTransformationAction(id, programId)
      setDeletingId(null)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Transformación eliminada")
      router.refresh()
    })
  }

  if (transformations.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Sumá casos de antes/después: son la prueba social que más convence.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {transformations.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex shrink-0 gap-1">
              {t.before_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.before_url}
                  alt=""
                  className="size-12 rounded-md object-cover"
                />
              )}
              {t.after_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.after_url}
                  alt=""
                  className="size-12 rounded-md object-cover"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{t.client_name}</span>
              {t.metric && (
                <span className="truncate text-sm text-muted-foreground">
                  {t.metric}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Link
                href={`/coach/programs/${programId}/transformations/${t.id}`}
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                aria-label="Editar transformación"
              >
                <Pencil className="size-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                disabled={isPending && deletingId === t.id}
                onClick={() => handleDelete(t.id)}
                aria-label="Eliminar transformación"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
