import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function RoutinesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* New routine button skeleton */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Routines list skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}
