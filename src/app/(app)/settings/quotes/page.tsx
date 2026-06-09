import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser } from "@/lib/supabase/auth"
import { getQuotePreferences } from "@/lib/db/quote-preferences"
import { QuoteSettingsForm } from "@/features/quotes/quote-settings-form"

export const metadata: Metadata = {
  title: "Frases & Reflexiones — EPHA",
}

export default async function QuoteSettingsPage() {
  const supabase = await createClient()
  const user = await getCachedUser()

  const preferences = user
    ? await getQuotePreferences(supabase, user.id)
    : { enabled: true, categories: [] }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">Frases & Reflexiones</h1>
          <p className="text-xs text-muted-foreground">
            Personalizá las frases del dashboard
          </p>
        </div>
      </div>

      <QuoteSettingsForm preferences={preferences} />
    </div>
  )
}
