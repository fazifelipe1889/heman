import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function MiAsesoriaLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Coach info skeleton */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </Card>

      {/* Perks skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-20" />
        <Card className="p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-4 w-full" />
          ))}
        </Card>
      </div>

      {/* Chat skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-20" />
        <Card className="flex h-96 flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-3/4" />
          ))}
        </Card>
      </div>
    </div>
  )
}
