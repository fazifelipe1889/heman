import { requireCoach } from "@/lib/auth/guards"
import { CoachNav } from "@/features/coach/coach-nav"

/**
 * Layout del panel del coach. El guard `requireCoach` redirige:
 * - sin perfil de coach → /coach/apply
 * - perfil no activo → /coach/pending
 * Por eso /coach/apply y /coach/pending viven FUERA de este grupo (panel).
 */
export default async function CoachPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireCoach()

  return (
    <div className="flex flex-1 flex-col">
      <CoachNav />
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</div>
    </div>
  )
}
