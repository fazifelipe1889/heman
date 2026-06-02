import { FileText, Apple } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ContentBlock } from "@/lib/domain/coaching"

/**
 * Renderiza el material entregable del producto comprado (bloques de texto +
 * nutrición). Los tipos multimedia se habilitan en una etapa posterior.
 */
export function ProductContent({
  content,
  nutritionNotes,
}: {
  content: ContentBlock[]
  nutritionNotes: string | null
}) {
  const textBlocks = content.filter((b) => b.type === "text" && (b.title || b.body))
  if (textBlocks.length === 0 && !nutritionNotes) return null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <FileText className="size-5" /> Tu material
      </h2>

      {textBlocks.map((b, i) => (
        <Card key={i} size="sm">
          <CardContent className="flex flex-col gap-1 py-3">
            {b.title && <span className="text-sm font-medium">{b.title}</span>}
            {b.body && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {b.body}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {nutritionNotes && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 py-3">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Apple className="size-4 text-primary" /> Nutrición y planificación
            </span>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {nutritionNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
