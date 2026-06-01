/**
 * Guards de autenticación y autorización para Server Components / Actions.
 *
 * Centralizan la verificación de sesión y rol. Redirigen cuando el acceso no
 * es válido, de modo que el código que los consume puede asumir el contexto
 * ya resuelto. No usar en el cliente.
 */

import { redirect } from "next/navigation"
import type { SupabaseClient, User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { Database, CoachProfile, Profile } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export type UserContext = { supabase: Client; user: User }
export type CoachContext = UserContext & { coach: CoachProfile }
export type AdminContext = UserContext & { profile: Profile }

/** Requiere sesión iniciada. Redirige a /login si no hay usuario. */
export async function requireUser(): Promise<UserContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, user }
}

/**
 * Requiere ser coach con perfil activo.
 * - Sin sesión → /login
 * - Sin perfil de coach → /coach/apply (onboarding de coach)
 * - Perfil no activo (pending/suspended) → /coach/pending
 */
export async function requireCoach(): Promise<CoachContext> {
  const { supabase, user } = await requireUser()

  const { data: coach, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()
  if (error) throw error

  if (!coach) redirect("/coach/apply")
  if (coach.status !== "active") redirect("/coach/pending")

  return { supabase, user, coach }
}

/**
 * Variante que NO redirige: devuelve el perfil de coach o null.
 * Útil para decidir qué UI mostrar sin forzar navegación.
 */
export async function getCoachContext(): Promise<{
  supabase: Client
  user: User | null
  coach: CoachProfile | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, coach: null }

  const { data: coach } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return { supabase, user, coach: coach ?? null }
}

/** Requiere rol admin. Redirige a /dashboard si no lo es. */
export async function requireAdmin(): Promise<AdminContext> {
  const { supabase, user } = await requireUser()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()
  if (error) throw error

  if (!profile || profile.role !== "admin") redirect("/dashboard")

  return { supabase, user, profile }
}
