import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Settings sections skeleton */}
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            <Card className="p-4">
              <Skeleton className="h-4 w-full" />
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
