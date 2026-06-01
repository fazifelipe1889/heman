import Link from "next/link"
import { Dumbbell } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">EPHA</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Tu gimnasio, optimizado. Planificá, entrená y seguí tu progreso sin
          perder tiempo entre series.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/register"
          className={cn(buttonVariants({ size: "lg" }), "h-12 text-base")}
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 text-base"
          )}
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  )
}
