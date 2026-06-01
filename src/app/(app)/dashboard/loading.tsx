import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <div className="text-5xl font-bold tracking-tighter text-primary">EPHA</div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Quote skeleton */}
      <Card>
        <CardContent className="py-6">
          <Skeleton className="mb-3 h-16 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      {/* Sections skeleton */}
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="mb-2 h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
