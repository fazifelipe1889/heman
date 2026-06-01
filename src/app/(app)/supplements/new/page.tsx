import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SupplementForm } from "@/features/supplements/supplement-form"

export const metadata: Metadata = {
  title: "Nuevo suplemento — EPHA",
}

export default function NewSupplementPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/supplements"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Nuevo suplemento</h1>
      </div>
      <SupplementForm />
    </div>
  )
}
