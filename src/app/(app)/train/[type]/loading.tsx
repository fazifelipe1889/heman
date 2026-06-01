import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function TrainTypeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Planificación section */}
      <section className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Card className="p-4">
          <Skeleton className="mb-3 h-4 w-12" />
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </section>

      {/* Buscar rutina section */}
      <section className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-5 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </section>
    </div>
  )
}
