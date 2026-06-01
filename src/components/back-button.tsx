"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ rootPath = "/dashboard" }: { rootPath?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === rootPath) return null

  return (
    <button
      onClick={() => router.back()}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Volver"
    >
      <ArrowLeft className="size-5" />
    </button>
  )
}
