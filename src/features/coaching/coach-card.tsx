import Link from "next/link"
import { Star, BadgeCheck, MapPin } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { formatMoney, getInitials } from "@/lib/domain/coaching"
import type { MarketplaceCoach } from "@/lib/db/coaching"

export function CoachCard({ coach }: { coach: MarketplaceCoach }) {
  const subtitle = coach.headline || coach.bio

  return (
    <Link href={`/c/${coach.handle}`} className="rounded-xl">
      <Card className="overflow-hidden transition-colors hover:border-primary/50">
        {coach.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.cover_url}
            alt=""
            className="h-24 w-full object-cover"
          />
        ) : (
          <div className="h-20 w-full bg-gradient-to-br from-primary/20 to-muted" />
        )}
        <CardContent className="flex flex-col gap-2 py-3">
          <div className="-mt-9 flex items-end gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-base font-bold ring-4 ring-card">
              {coach.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coach.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                getInitials(coach.display_name)
              )}
            </div>
            {coach.rating_count > 0 && (
              <span className="mb-1 flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-primary text-primary" />
                {coach.rating_avg.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="flex items-center gap-1 font-medium leading-snug">
              {coach.display_name}
              {coach.is_verified && <BadgeCheck className="size-4 text-primary" />}
            </h3>
            {coach.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {coach.location}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          )}

          {coach.price_from_cents !== null && (
            <div className="border-t pt-2 text-sm">
              <span className="text-muted-foreground">Desde </span>
              <span className="font-semibold">
                {formatMoney(coach.price_from_cents)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
