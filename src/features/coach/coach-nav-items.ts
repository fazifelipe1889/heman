import type { ComponentType } from "react"
import { LayoutDashboard, Dumbbell, Users, Wallet, UserCog } from "lucide-react"

export type CoachTab = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Si es exact, solo activa cuando el pathname coincide exactamente. */
  exact: boolean
}

/**
 * Items de navegación del panel del coach. Fuente única compartida por la barra
 * inferior/superior mobile (`CoachNav`) y el sidebar desktop (`CoachSidebar`).
 */
export const COACH_TABS: CoachTab[] = [
  { href: "/coach", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/coach/programs", label: "Productos", icon: Dumbbell, exact: false },
  { href: "/coach/clients", label: "Clientes", icon: Users, exact: false },
  { href: "/coach/earnings", label: "Ingresos", icon: Wallet, exact: false },
  { href: "/coach/settings", label: "Perfil", icon: UserCog, exact: false },
]
