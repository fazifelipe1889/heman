"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { setCoachStatus } from "@/lib/db/coaching"
import type { CoachStatus } from "@/lib/domain/coaching"

export type ActionResult = { error?: string }

/**
 * Cambia el estado de un coach (aprobar / rechazar / suspender / reactivar).
 *
 * Gated por requireAdmin. La actualización se hace con cliente service_role
 * porque la policy de coach_profiles solo permite update al propio coach.
 */
export async function moderateCoachAction(
  coachId: string,
  status: CoachStatus
): Promise<ActionResult> {
  await requireAdmin()

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY." }
  }

  try {
    await setCoachStatus(admin, coachId, status)
  } catch {
    return { error: "No se pudo actualizar el estado del coach." }
  }

  revalidatePath("/admin/coaches")
  return {}
}
