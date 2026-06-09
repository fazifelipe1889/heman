import { cache } from "react"
import type { User } from "@supabase/supabase-js"

import { createClient } from "./server"
import { getProfile } from "@/lib/db/profiles"
import type { Profile } from "./types"

/**
 * Helpers de sesión deduplicados por request con `React.cache()`.
 *
 * Problema que resuelven: en una sola navegación, el layout de `(app)` y la
 * página que renderiza dentro de él llamaban cada uno a `supabase.auth.getUser()`
 * (round-trip de red al servidor de Auth) y a `getProfile()` (query a la DB).
 * Eso son 2-3 viajes redundantes antes de pintar nada.
 *
 * `cache()` memoiza el resultado durante el render del servidor: la primera
 * llamada hace el trabajo real, las siguientes (mismo request) devuelven el
 * valor memoizado. Layout + page colapsan a UNA sola llamada de red.
 *
 * Seguridad: se mantiene `getUser()` (valida el JWT contra el servidor de Auth),
 * no se baja a `getSession()`. Solo se elimina la duplicación, no la validación.
 */

export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
})

export const getCachedProfile = cache(
  async (userId: string): Promise<Profile | null> => {
    const supabase = await createClient()
    return getProfile(supabase, userId).catch(() => null)
  },
)
