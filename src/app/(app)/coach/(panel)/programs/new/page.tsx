import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requireCoach } from "@/lib/auth/guards"
import { PRODUCT_TYPES, type ProductType } from "@/lib/domain/coaching"
import { PRODUCT_TYPE_LABELS } from "@/lib/domain/labels"
import { ProductForm } from "@/features/coach/product-form"

export const metadata: Metadata = { title: "Nuevo producto — EPHA" }

function resolveType(v: string | undefined): ProductType {
  return (PRODUCT_TYPES as readonly string[]).includes(v ?? "")
    ? (v as ProductType)
    : "asesoria"
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await requireCoach()
  const { type } = await searchParams
  const productType = resolveType(type)
  const label = PRODUCT_TYPE_LABELS[productType]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/coach/programs"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Mis productos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Nueva {label.toLowerCase()}
        </h1>
        <p className="text-sm text-muted-foreground">
          Completá la vitrina y el contenido. Después la publicás.
        </p>
      </div>
      <ProductForm productType={productType} />
    </div>
  )
}
