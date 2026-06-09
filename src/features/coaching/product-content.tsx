import { FileText, Apple } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ContentBlock, IntakeAnswers } from "@/lib/domain/coaching"
import { evaluateNutritionTemplate } from "@/lib/domain/nutrition-formulas"

/**
 * Renderiza el material entregable del producto comprado (bloques de texto +
 * nutrición). Los tipos multimedia se habilitan en una etapa posterior.
 */
export function ProductContent({
  content,
  nutritionNotes,
  intakeAnswers = {},
}: {
  content: ContentBlock[]
  nutritionNotes: string | null
  intakeAnswers?: IntakeAnswers
}) {
  const textBlocks = content.filter((b) => b.type === "text" && (b.title || b.body))
  if (textBlocks.length === 0 && !nutritionNotes) return null

  const evaluatedNotes = nutritionNotes
    ? evaluateNutritionTemplate(nutritionNotes, intakeAnswers)
    : null

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

      {evaluatedNotes && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 py-3">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Apple className="size-4 text-primary" /> Nutrición y planificación
            </span>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {evaluatedNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
