import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/db/profiles"
import { OnboardingWizard } from "@/features/profile/onboarding-wizard"

export const metadata: Metadata = {
  title: "Configurá tu perfil — EPHA",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const profile = user ? await getProfile(supabase, user.id) : null

  return <OnboardingWizard initialFullName={profile?.full_name ?? ""} />
}
