import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, Clock, Tag } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getWikiArticle } from "@/lib/db/wiki"
import { WIKI_CATEGORY_META } from "@/lib/domain/wiki"
import { Badge } from "@/components/ui/badge"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const article = await getWikiArticle(supabase, slug)
  if (!article) return { title: "Artículo — EPHA" }
  return {
    title: `${article.title} — Wiki Gym`,
    description: article.summary,
  }
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const article = await getWikiArticle(supabase, slug)

  if (!article) notFound()

  const meta = WIKI_CATEGORY_META[article.category]

  // Renderizar contenido: párrafos separados por doble salto de línea
  const paragraphs = article.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-0 pb-16">
      {/* Cover */}
      {article.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_url}
          alt={article.title}
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-muted/50">
          <BookOpen className="size-12 text-muted-foreground/30" />
        </div>
      )}

      <div className="flex flex-col gap-5 px-4 pt-5">
        {/* Volver */}
        <Link
          href="/wiki"
          className="flex w-fit items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-4" />
          Wiki Gym
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}
          >
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {article.read_time_min} min de lectura
          </span>
        </div>

        {/* Título y resumen */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            {article.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Separador */}
        <hr className="border-border" />

        {/* Contenido */}
        {paragraphs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BookOpen className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Contenido próximamente.
            </p>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tag className="size-3" />
              <span>Etiquetas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
