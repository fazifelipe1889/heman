import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function TrainLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Two buttons skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Plan card skeleton */}
      <Card className="p-4">
        <Skeleton className="mb-2 h-5 w-24" />
        <Skeleton className="h-4 w-full" />
      </Card>
    </div>
  )
}
