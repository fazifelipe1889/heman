"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from "./schemas"

export type AuthResult = {
  error?: string
}

/** Traduce los mensajes de error de Supabase Auth a español. */
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "Email o contraseña incorrectos."
  if (m.includes("email not confirmed"))
    return "Tenés que confirmar tu email antes de iniciar sesión."
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Ese email ya está registrado."
  if (m.includes("password"))
    return "La contraseña no cumple los requisitos mínimos."
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Probá de nuevo en unos minutos."
  if (m.includes("token has expired") || m.includes("expired"))
    return "El código expiró. Pedí uno nuevo."
  if (m.includes("invalid") && m.includes("token"))
    return "El código es incorrecto."
  if (m.includes("otp") || m.includes("token"))
    return "Código inválido o expirado."
  return "Ocurrió un error. Intentá nuevamente."
}

export async function signInAction(values: SignInValues): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(values)
  if (!parsed.success) return { error: "Datos inválidos." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: mapAuthError(error.message) }

  redirect("/dashboard")
}

export async function signUpAction(values: SignUpValues): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(values)
  if (!parsed.success) return { error: "Datos inválidos." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  })
  if (error) return { error: mapAuthError(error.message) }

  redirect("/onboarding")
}


export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
