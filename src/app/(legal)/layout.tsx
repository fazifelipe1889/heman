import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { EphaWordmark } from "@/components/epha-wordmark"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header mínimo */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Volver
          </Link>
          <div className="flex flex-1 items-center justify-center">
            {/* Wordmark sólido sin glow */}
            <EphaWordmark size="sm" />
          </div>
          {/* spacer para centrar el logo */}
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  )
}
