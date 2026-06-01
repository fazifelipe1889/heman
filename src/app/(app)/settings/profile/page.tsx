import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/db/profiles"
import { ProfileEditForm } from "@/features/profile/profile-edit-form"

export const metadata: Metadata = {
  title: "Editar perfil — EPHA",
}

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const profile = user ? await getProfile(supabase, user.id) : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">Editar perfil</h1>
          <p className="text-xs text-muted-foreground">
            Tus datos personales y objetivos
          </p>
        </div>
      </div>

      {profile && <ProfileEditForm profile={profile} />}
    </div>
  )
}
