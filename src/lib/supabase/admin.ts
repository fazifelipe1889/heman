import { createClient as createServiceClient } from "@supabase/supabase-js"

import type { Database } from "./types"

/**
 * Cliente Supabase con service_role. SOLO para uso en servidor (Server Actions,
 * Route Handlers, Edge Functions). Bypassa RLS, por eso NUNCA debe importarse
 * en código de cliente ni exponerse al navegador.
 *
 * Se usa para operaciones privilegiadas como el provisioning de suscripciones
 * (insertar en coaching_subscription, que no tiene policy de INSERT pública).
 *
 * Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL para el cliente admin."
    )
  }

  return createServiceClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
