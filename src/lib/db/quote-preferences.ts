import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import type { QuoteCategory } from "@/lib/domain/quotes"

type Supabase = SupabaseClient<Database>

export type QuotePreferences = {
  enabled: boolean
  categories: QuoteCategory[]  // vacío = todas activas
}

const DEFAULT_PREFS: QuotePreferences = {
  enabled: true,
  categories: [],
}

export async function getQuotePreferences(
  supabase: Supabase,
  userId: string,
): Promise<QuotePreferences> {
  const { data } = await supabase
    .from("quote_preferences")
    .select("enabled, categories")
    .eq("user_id", userId)
    .single()

  if (!data) return DEFAULT_PREFS

  return {
    enabled: data.enabled,
    categories: (data.categories as QuoteCategory[]) ?? [],
  }
}

export async function upsertQuotePreferences(
  supabase: Supabase,
  userId: string,
  prefs: QuotePreferences,
): Promise<boolean> {
  const { error } = await supabase.from("quote_preferences").upsert({
    user_id: userId,
    enabled: prefs.enabled,
    categories: prefs.categories,
    updated_at: new Date().toISOString(),
  })
  return !error
}
