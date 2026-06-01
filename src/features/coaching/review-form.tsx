"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReviewAction } from "./actions"

export function ReviewForm({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter()
  const [rating, setRating] = React.useState(0)
  const [hover, setHover] = React.useState(0)
  const [comment, setComment] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit() {
    if (rating < 1) {
      toast.error("Elegí una calificación.")
      return
    }
    startTransition(async () => {
      const res = await createReviewAction({
        subscriptionId,
        rating,
        comment: comment.trim() || undefined,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("¡Gracias por tu reseña!")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1
          const filled = (hover || rating) >= value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${value} estrellas`}
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  filled ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </button>
          )
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Contá tu experiencia (opcional)…"
        rows={3}
      />
      <Button disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Enviando…" : "Enviar reseña"}
      </Button>
    </div>
  )
}
