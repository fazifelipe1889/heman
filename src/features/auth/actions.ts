"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  signInSchema,
  signUpSchema,
  verifyOtpSchema,
  type SignInValues,
  type SignUpValues,
  type VerifyOtpValues,
} from "./schemas"

export type AuthResult = {
  error?: string
  needsConfirmation?: boolean
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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  })
  if (error) return { error: mapAuthError(error.message) }

  // Defensa contra el auto-login: si el proyecto de Supabase tiene la
  // confirmación de email desactivada, signUp devuelve una sesión y el usuario
  // queda logueado sin verificar su correo. Cerramos esa sesión y forzamos
  // siempre el paso de confirmación por código.
  if (data.session) {
    await supabase.auth.signOut()
  }

  // El usuario debe ingresar el código de 6 dígitos que recibió por email.
  return { needsConfirmation: true }
}

/**
 * Verifica el código OTP de 6 dígitos que el usuario recibió por email tras
 * registrarse. Si es válido, Supabase confirma la cuenta y crea la sesión.
 */
export async function verifyOtpAction(
  values: VerifyOtpValues,
): Promise<AuthResult> {
  const parsed = verifyOtpSchema.safeParse(values)
  if (!parsed.success) return { error: "Código inválido." }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "signup",
  })
  if (error) return { error: mapAuthError(error.message) }
  if (!data.session) return { error: "No se pudo confirmar la cuenta." }

  redirect("/onboarding")
}

/** Reenvía el código de confirmación al email indicado. */
export async function resendOtpAction(email: string): Promise<AuthResult> {
  const parsed = signInSchema.shape.email.safeParse(email)
  if (!parsed.success) return { error: "Email inválido." }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
  })
  if (error) return { error: mapAuthError(error.message) }

  return {}
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
