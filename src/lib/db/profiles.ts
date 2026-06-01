import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Profile, ProfileUpdate } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

/**
 * Capa de acceso a datos de perfiles. Framework-agnóstica: recibe el cliente
 * de Supabase apropiado al entorno (server/browser), de modo que pueda
 * reutilizarse en un futuro shell nativo. Ningún componente debe llamar a
 * Supabase directamente; siempre a través de estas funciones.
 */

export async function getProfile(
  supabase: Client,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateProfile(
  supabase: Client,
  userId: string,
  values: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}
