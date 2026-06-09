"use server"

import { createClient } from "@/lib/supabase/server"
import { getCachedUser } from "@/lib/supabase/auth"
import { updateProfile } from "@/lib/db/profiles"

/**
 * Marca el tour de bienvenida como completado para el usuario actual.
 * Resiliente: si la columna `tour_completed_at` aún no existe (migración 0027
 * sin aplicar) el write falla en silencio; el respaldo en localStorage del
 * lanzador evita que el tour vuelva a aparecer mientras tanto.
 */
export async function completeTourAction(): Promise<void> {
  try {
    const user = await getCachedUser()
    if (!user) return
    const supabase = await createClient()
    await updateProfile(supabase, user.id, {
      tour_completed_at: new Date().toISOString(),
    })
  } catch {
    // no-op: ver doc arriba
  }
}

/** Reinicia el flag para volver a mostrar el tour (entrada "Ver tutorial"). */
export async function resetTourAction(): Promise<void> {
  try {
    const user = await getCachedUser()
    if (!user) return
    const supabase = await createClient()
    await updateProfile(supabase, user.id, { tour_completed_at: null })
  } catch {
    // no-op
  }
}
