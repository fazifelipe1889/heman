import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Clock, Search, TriangleAlert } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listWikiArticles } from "@/lib/db/wiki"
import type { WikiCategory } from "@/lib/domain/enums"
import { WIKI_CATEGORY_LIST, WIKI_CATEGORY_META } from "@/lib/domain/wiki"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Wiki Gym — EPHA",
}

export default async function WikiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}) {
  const params = await searchParams
  const query = params.q ?? ""
  const rawCat = params.categoria ?? ""
  const category = WIKI_CATEGORY_LIST.find((c) => c.value === rawCat)
    ?.value as WikiCategory | undefined

  const supabase = await createClient()
  const articles = await listWikiArticles(supabase, { query, category })

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Wiki Gym</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Biblioteca de conocimiento sobre entrenamiento y nutrición.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3.5 py-3 text-xs text-amber-600 dark:text-amber-400">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
        <p className="leading-relaxed">
          El contenido de esta biblioteca es <strong>solo informativo y educativo</strong>. No
          reemplaza la opinión de un médico, nutricionista u otro profesional de la salud.
          Consultá a un profesional antes de iniciar cualquier programa de entrenamiento o cambio
          en tu alimentación.{" "}
          <Link href="/terms" className="underline underline-offset-3 hover:opacity-80">
            Más información
          </Link>
          .
        </p>
      </div>

      {/* Búsqueda */}
      <form method="GET" action="/wiki" className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={query}
          placeholder="Buscar artículos..."
          className="pl-9"
        />
        {/* Mantener filtro de categoría al buscar */}
        {category && <input type="hidden" name="categoria" value={category} />}
      </form>

      {/* Filtros de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={query ? `/wiki?q=${encodeURIComponent(query)}` : "/wiki"}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          Todos
        </Link>
        {WIKI_CATEGORY_LIST.map((cat) => {
          const isActive = category === cat.value
          const href = query
            ? `/wiki?q=${encodeURIComponent(query)}&categoria=${cat.value}`
            : `/wiki?categoria=${cat.value}`
          return (
            <Link
              key={cat.value}
              href={href}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Resultados */}
      {articles.length === 0 ? (
        <EmptyState query={query} category={category} />
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article) => {
            const meta = WIKI_CATEGORY_META[article.category]
            return (
              <Link key={article.id} href={`/wiki/${article.slug}`}>
                <Card className="flex flex-col gap-3 overflow-hidden p-0 transition-colors hover:border-primary/50">
                  {/* Cover placeholder */}
                  {article.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.cover_url}
                      alt={article.title}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-muted/50">
                      <BookOpen className="size-8 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {article.read_time_min} min
                      </span>
                    </div>
                    <p className="font-semibold leading-snug">{article.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {article.summary}
                    </p>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {article.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  query,
  category,
}: {
  query: string
  category?: WikiCategory
}) {
  const meta = category ? WIKI_CATEGORY_META[category] : null
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <BookOpen className="size-10 text-muted-foreground/40" />
      {query ? (
        <>
          <p className="font-medium">Sin resultados para &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">
            Probá con otras palabras o explorá las categorías.
          </p>
        </>
      ) : meta ? (
        <>
          <p className="font-medium">Sin artículos en {meta.label}</p>
          <p className="text-sm text-muted-foreground">
            Próximamente vas a encontrar contenido aquí.
          </p>
        </>
      ) : (
        <>
          <p className="font-medium">La biblioteca está vacía</p>
          <p className="text-sm text-muted-foreground">
            Próximamente vas a encontrar artículos sobre entrenamiento,
            nutrición y más.
          </p>
        </>
      )}
    </Card>
  )
}
