"use client"

import * as React from "react"

import type { CoachingPlan } from "@/lib/supabase/types"
import { PlanPurchaseCard } from "./plan-purchase-card"
import { ProgramQuiz } from "./program-quiz"

export function ProgramPlans({
  plans,
  handle,
  slug,
  /** Índice del plan a destacar por defecto (antes de hacer el quiz). */
  defaultFeatured,
}: {
  plans: CoachingPlan[]
  handle: string
  slug: string
  defaultFeatured?: number
}) {
  const [recommendedId, setRecommendedId] = React.useState<string | null>(null)

  // Al recomendar, desplazar la card a la vista.
  React.useEffect(() => {
    if (!recommendedId) return
    const el = document.getElementById(`plan-${recommendedId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [recommendedId])

  return (
    <div className="flex flex-col gap-3">
      <ProgramQuiz plans={plans} onRecommend={setRecommendedId} />

      {plans.map((plan, i) => (
        <PlanPurchaseCard
          key={plan.id}
          plan={plan}
          handle={handle}
          slug={slug}
          recommended={recommendedId === plan.id}
          highlight={
            recommendedId === null && defaultFeatured !== undefined && i === defaultFeatured
          }
        />
      ))}
    </div>
  )
}
