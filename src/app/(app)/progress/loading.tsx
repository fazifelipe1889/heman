import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ProgressLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-6 w-16" />
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="p-4">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-64 w-full" />
      </Card>

      {/* Details skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}
