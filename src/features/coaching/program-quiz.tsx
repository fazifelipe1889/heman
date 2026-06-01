"use client"

import * as React from "react"
import { Sparkles, RotateCcw } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  recommendPlan,
  type QuizAnswers,
  type QuizGoal,
  type QuizExperience,
  type QuizSupport,
  type QuizDays,
} from "@/lib/domain/coaching"

/** Plan mínimo que necesita el quiz para puntuar. */
export type QuizPlan = { id: string; name: string; price_cents: number; perks: unknown }

type Step = {
  key: keyof QuizAnswers
  question: string
  options: { value: string; label: string }[]
}

const STEPS: Step[] = [
  {
    key: "goal",
    question: "¿Cuál es tu objetivo principal?",
    options: [
      { value: "ganar_musculo", label: "Ganar masa muscular" },
      { value: "perder_grasa", label: "Perder grasa" },
      { value: "recomposicion", label: "Recomposición" },
      { value: "fuerza", label: "Ganar fuerza" },
      { value: "rendimiento", label: "Rendimiento" },
    ],
  },
  {
    key: "experience",
    question: "¿Cuánta experiencia entrenando tenés?",
    options: [
      { value: "principiante", label: "Principiante (menos de 1 año)" },
      { value: "intermedio", label: "Intermedio (1-3 años)" },
      { value: "avanzado", label: "Avanzado (3+ años)" },
    ],
  },
  {
    key: "days",
    question: "¿Cuántos días por semana podés entrenar?",
    options: [
      { value: "2-3", label: "2 a 3 días" },
      { value: "4-5", label: "4 a 5 días" },
      { value: "6+", label: "6 o más días" },
    ],
  },
  {
    key: "support",
    question: "¿Qué nivel de acompañamiento buscás?",
    options: [
      { value: "autonomo", label: "Autónomo — me organizo solo" },
      { value: "seguimiento", label: "Seguimiento regular" },
      { value: "cercano", label: "Cercano — quiero contacto 1 a 1" },
    ],
  },
]

export function ProgramQuiz({
  plans,
  onRecommend,
}: {
  plans: QuizPlan[]
  /** Notifica el plan recomendado para que el contenedor lo resalte. */
  onRecommend: (planId: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Partial<QuizAnswers>>({})
  const [result, setResult] = React.useState<{ planId: string; reason: string } | null>(
    null,
  )

  function pick(key: keyof QuizAnswers, value: string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)

    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }

    // Última respuesta → calcular recomendación.
    const rec = recommendPlan(plans, next as QuizAnswers)
    setResult(rec)
    onRecommend(rec?.planId ?? null)
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setResult(null)
    onRecommend(null)
  }

  if (plans.length < 2) return null

  // Estado colapsado: invitación a hacer el quiz.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-left transition-colors hover:border-primary/60"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">¿No sabés qué plan elegir?</span>
          <span className="text-xs text-muted-foreground">
            Respondé 4 preguntas y te recomendamos el ideal.
          </span>
        </div>
      </button>
    )
  }

  // Resultado.
  if (result) {
    const plan = plans.find((p) => p.id === result.planId)
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold">Tu plan recomendado</span>
          </div>
          {plan && <p className="text-lg font-bold">{plan.name}</p>}
          <p className="text-sm text-muted-foreground">{result.reason}</p>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={reset}
          >
            <RotateCcw className="size-4" />
            Rehacer test
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Pregunta en curso.
  const current = STEPS[step]
  return (
    <Card className="border-primary/30">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <p className="text-base font-semibold">{current.question}</p>
        <div className="flex flex-col gap-2">
          {current.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(current.key, opt.value)}
              className="rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Re-export de tipos para que el consumidor no importe del dominio directo si no quiere.
export type { QuizGoal, QuizExperience, QuizSupport, QuizDays }
