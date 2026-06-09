import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { getCachedUser, getCachedProfile } from "@/lib/supabase/auth"
import { ProfileEditForm } from "@/features/profile/profile-edit-form"

export const metadata: Metadata = {
  title: "Editar perfil — EPHA",
}

export default async function ProfileEditPage() {
  const user = await getCachedUser()
  const profile = user ? await getCachedProfile(user.id) : null

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
