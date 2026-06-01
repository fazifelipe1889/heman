import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/db/profiles"

export default async function OnboardingLayout({
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
  if (profile?.onboarding_completed) redirect("/dashboard")

  return <div className="flex flex-1 flex-col">{children}</div>
}
