"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { upsertQuotePreferences } from "@/lib/db/quote-preferences"
import type { QuoteCategory } from "@/lib/domain/quotes"
import { QUOTE_CATEGORIES } from "@/lib/domain/quotes"

export async function saveQuotePreferencesAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const enabled = formData.get("enabled") === "true"
  const rawCats = formData.getAll("categories")
  const categories = rawCats
    .map(String)
    .filter((c): c is QuoteCategory =>
      (QUOTE_CATEGORIES as readonly string[]).includes(c),
    )

  await upsertQuotePreferences(supabase, user.id, { enabled, categories })
  revalidatePath("/dashboard")
  return {}
}
