import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function QuoteSettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
