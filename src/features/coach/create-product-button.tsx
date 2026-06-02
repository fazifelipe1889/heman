"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronRight, UserCog, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_DESCRIPTIONS,
} from "@/lib/domain/labels"
import type { ProductType } from "@/lib/domain/coaching"

const TYPE_ICONS: Record<ProductType, React.ElementType> = {
  asesoria: UserCog,
  plan: BookOpen,
}

export function CreateProductButton({ size = "sm" }: { size?: "sm" | "lg" }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  function choose(type: ProductType) {
    setOpen(false)
    router.push(`/coach/programs/new?type=${type}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size={size}>
            <Plus className="size-4" /> Crear
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Qué querés crear?</DialogTitle>
          <DialogDescription>
            Elegí el tipo de producto que vas a publicar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => choose(type)}
                className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">
                    {PRODUCT_TYPE_LABELS[type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {PRODUCT_TYPE_DESCRIPTIONS[type]}
                  </span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
