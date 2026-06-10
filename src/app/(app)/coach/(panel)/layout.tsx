import { requireCoach } from "@/lib/auth/guards"
import { CoachNav } from "@/features/coach/coach-nav"
import { CoachSidebar } from "@/features/coach/coach-sidebar"

/**
 * Layout del panel del coach. El guard `requireCoach` redirige:
 * - sin perfil de coach → /coach/apply
 * - perfil no activo → /coach/pending
 * Por eso /coach/apply y /coach/pending viven FUERA de este grupo (panel).
 *
 * Desktop (lg:): sidebar fijo a la izquierda + área principal ancha.
 * Mobile: sin cambios — barra `CoachNav` arriba + columna `max-w-md`.
 */
export default async function CoachPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { coach } = await requireCoach()

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <CoachSidebar
        displayName={coach.display_name}
        handle={coach.handle}
        avatarUrl={coach.avatar_url}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <CoachNav />
        <div className="mx-auto w-full max-w-md flex-1 px-4 py-6 lg:max-w-6xl lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
