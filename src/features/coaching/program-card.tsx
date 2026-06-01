import Link from "next/link"
import { Star, BadgeCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney, getInitials } from "@/lib/domain/coaching"
import { COACHING_CATEGORY_LABELS } from "@/lib/domain/labels"
import type { MarketplaceProgram } from "@/lib/db/coaching"

export function ProgramCard({ program }: { program: MarketplaceProgram }) {
  const { coach } = program

  return (
    <Link
      href={`/c/${coach.handle}/${program.slug}`}
      className="rounded-xl"
    >
      <Card className="overflow-hidden transition-colors hover:border-primary/50">
        {program.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={program.cover_url}
            alt={program.title}
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-muted" />
        )}
        <CardContent className="flex flex-col gap-2 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {COACHING_CATEGORY_LABELS[program.category]}
            </Badge>
            {program.level && (
              <span className="text-xs text-muted-foreground">{program.level}</span>
            )}
          </div>
          <h3 className="font-medium leading-snug">{program.title}</h3>
          {program.tagline && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {program.tagline}
            </p>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            {/* Coach */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold">
                {coach.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  getInitials(coach.display_name)
                )}
              </div>
              <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                {coach.display_name}
                {coach.is_verified && <BadgeCheck className="size-3 text-primary" />}
              </span>
            </div>

            {/* Rating */}
            {coach.rating_count > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="size-3 fill-primary text-primary" />
                {coach.rating_avg.toFixed(1)}
              </span>
            )}
          </div>

          {program.price_from_cents !== null && (
            <div className="border-t pt-2 text-sm">
              <span className="text-muted-foreground">Desde </span>
              <span className="font-semibold">
                {formatMoney(program.price_from_cents)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
