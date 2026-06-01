import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import type { WikiCategory } from "@/lib/domain/enums"

export type WikiArticle =
  Database["public"]["Tables"]["wiki_articles"]["Row"]

export type WikiArticleCard = Pick<
  WikiArticle,
  "id" | "slug" | "title" | "summary" | "category" | "tags" | "cover_url" | "read_time_min" | "created_at"
>

type Supabase = SupabaseClient<Database>

/**
 * Lista artículos publicados con filtros opcionales.
 * `query` hace búsqueda por título y resumen (ILIKE).
 * `category` filtra por categoría.
 */
export async function listWikiArticles(
  supabase: Supabase,
  opts: { query?: string; category?: WikiCategory } = {},
): Promise<WikiArticleCard[]> {
  let q = supabase
    .from("wiki_articles")
    .select("id, slug, title, summary, category, tags, cover_url, read_time_min, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (opts.category) {
    q = q.eq("category", opts.category)
  }

  if (opts.query && opts.query.trim().length > 0) {
    const term = `%${opts.query.trim()}%`
    q = q.or(`title.ilike.${term},summary.ilike.${term}`)
  }

  const { data, error } = await q

  if (error) {
    console.error("listWikiArticles error", error)
    return []
  }

  return (data ?? []) as WikiArticleCard[]
}

/**
 * Obtiene un artículo completo por slug.
 */
export async function getWikiArticle(
  supabase: Supabase,
  slug: string,
): Promise<WikiArticle | null> {
  const { data, error } = await supabase
    .from("wiki_articles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error) return null
  return data as WikiArticle
}
