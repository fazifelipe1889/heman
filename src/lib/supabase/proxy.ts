import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./types"

/** Rutas que requieren sesión iniciada. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/exercises",
  "/routines",
  "/workout",
  "/history",
  "/progress",
]

/** Páginas de auth: si ya hay sesión, se redirige fuera de ellas. */
const AUTH_PAGES = ["/login", "/register"]

/**
 * Refresca la sesión de Supabase en cada request, aplica la protección de
 * rutas y devuelve la respuesta con las cookies actualizadas.
 *
 * El gating de `onboarding_completed` (redirigir a /onboarding/setup) se
 * resuelve en el layout de `(app)` para no consultar la DB en cada request.
 *
 * Si aún no se configuraron las variables de entorno de Supabase, se omite
 * para que la app pueda arrancar durante el setup inicial.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANTE: no ejecutar lógica entre createServerClient y getUser().
  // try-catch: si getUser() falla por red, dejamos pasar y el server component
  // se encarga de su propio guard (redirect al login si no hay sesión).
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return supabaseResponse
  }

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Construye un redirect preservando las cookies de sesión refrescadas.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ""
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }

  if (!user && isProtected) return redirectTo("/login")
  if (user && isAuthPage) return redirectTo("/dashboard")

  return supabaseResponse
}
