import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, FileText, LogOut, ShieldCheck, Sparkles, UserPen } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/db/profiles"
import { signOutAction } from "@/features/auth/actions"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Configuración — EPHA",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const profile = user ? await getProfile(supabase, user.id) : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        {profile?.full_name && (
          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
        )}
      </div>

      {/* Opciones */}
      <Card className="divide-y divide-border overflow-hidden p-0">
        {/* Editar datos personales */}
        <Link
          href="/onboarding"
          className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <UserPen className="size-4 text-foreground" />
          </div>
          <span className="flex-1 text-sm font-medium">Editar datos personales</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        {/* Frases & Reflexiones */}
        <Link
          href="/settings/quotes"
          className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Sparkles className="size-4 text-foreground" />
          </div>
          <span className="flex-1 text-sm font-medium">Frases & Reflexiones</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        {/* Cerrar sesión */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <LogOut className="size-4 text-destructive" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-destructive">
              Cerrar sesión
            </span>
          </button>
        </form>
      </Card>

      {/* Legal */}
      <div className="flex flex-col gap-1">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Legal
        </p>
        <Card className="divide-y divide-border overflow-hidden p-0">
          <Link
            href="/privacy"
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <ShieldCheck className="size-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium">Política de Privacidad</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link
            href="/terms"
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <FileText className="size-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium">Términos y Condiciones</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </Card>
      </div>
    </div>
  )
}
