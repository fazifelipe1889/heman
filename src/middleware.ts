import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas excepto archivos estáticos e imágenes.
     * Necesario para que Supabase refresque el token en cada request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
