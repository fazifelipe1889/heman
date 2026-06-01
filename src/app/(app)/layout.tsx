import Link from "next/link"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/db/profiles"
import { WorkoutBanner } from "@/features/train/workout-banner"
import { EphaLogoButton } from "@/components/epha-logo-button"
import { BackButton } from "@/components/back-button"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getProfile(supabase, user.id).catch(() => null)
  if (!profile?.onboarding_completed) redirect("/onboarding")

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-1">
          <BackButton rootPath="/dashboard" />
          <EphaLogoButton href="/dashboard" aria_label="Ir al dashboard" />
        </div>
        <Link
          href="/settings"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Configuración"
        >
          <Settings className="size-5" />
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <WorkoutBanner />
    </div>
  )
}
