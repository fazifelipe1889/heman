import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function PlanLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Weekly planner skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-3">
            <Skeleton className="mb-2 h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}
