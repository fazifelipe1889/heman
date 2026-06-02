import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { getCoachProductWithPlan } from "@/lib/db/coaching"
import { ProductForm } from "@/features/coach/product-form"

export const metadata: Metadata = { title: "Editar producto — EPHA" }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, coach } = await requireCoach()

  const product = await getCoachProductWithPlan(supabase, id)
  if (!product || product.program.coach_id !== coach.id) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href={`/coach/programs/${id}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar producto</h1>
      </div>
      <ProductForm
        productType={product.program.product_type ?? "asesoria"}
        program={product.program}
        plan={product.plan}
        content={product.content}
        routineTemplate={product.routineTemplate}
      />
    </div>
  )
}
