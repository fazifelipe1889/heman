import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getSupplement } from "@/lib/db/supplements"
import { SupplementForm } from "@/features/supplements/supplement-form"

export const metadata: Metadata = {
  title: "Editar suplemento — EPHA",
}

export default async function EditSupplementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const supplement = await getSupplement(supabase, id)
  if (!supplement) notFound()

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
        <h1 className="text-xl font-bold tracking-tight">Editar suplemento</h1>
      </div>
      <SupplementForm supplement={supplement} />
    </div>
  )
}
