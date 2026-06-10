import type { Metadata } from "next"

import { requireCoach } from "@/lib/auth/guards"
import { AvatarForm } from "@/features/coach/avatar-form"

export const metadata: Metadata = { title: "Mi perfil de coach — EPHA" }

export default async function CoachSettingsPage() {
  const { coach } = await requireCoach()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Foto de perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tu foto pública como asesor.
        </p>
      </div>
      <AvatarForm coach={coach} />
    </div>
  )
}
