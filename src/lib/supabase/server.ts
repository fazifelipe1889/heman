import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./types"

/**
 * Cliente Supabase para Server Components, Route Handlers y Server Actions.
 * En Next 16 `cookies()` es asíncrono, por eso esta función es `async`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Invocado desde un Server Component: ignorar.
            // El middleware se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}
