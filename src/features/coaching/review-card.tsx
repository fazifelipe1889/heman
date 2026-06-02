import { Star } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { CoachingReview } from "@/lib/supabase/types"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  })
}

export function ReviewCard({ review }: { review: CoachingReview }) {
  return (
    <Card className="flex h-full w-64 flex-col overflow-hidden">
      {review.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.image_url}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}
      <CardContent className="flex flex-1 flex-col gap-2 py-3">
        <div className="flex items-center justify-between">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < review.rating
                    ? "size-3.5 fill-primary text-primary"
                    : "size-3.5 text-muted"
                }
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {fmtDate(review.created_at)}
          </span>
        </div>
        {review.comment && (
          <p className="text-sm text-muted-foreground">“{review.comment}”</p>
        )}
      </CardContent>
    </Card>
  )
}
