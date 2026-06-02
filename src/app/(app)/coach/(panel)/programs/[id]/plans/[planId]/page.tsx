import { redirect } from "next/navigation"

/**
 * Deprecado (modelo de "producto plano"): el precio/duración/perks se editan
 * dentro del producto. Redirige al editor unificado.
 */
export default async function DeprecatedEditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/coach/programs/${id}/edit`)
}
