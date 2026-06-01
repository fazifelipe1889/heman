import { Dumbbell, HeartPulse, Repeat2, Zap, type LucideIcon } from "lucide-react"

import type { RoutineType } from "@/lib/domain/enums"

export const ROUTINE_TYPE_META: Record<
  RoutineType,
  { label: string; short: string; icon: LucideIcon }
> = {
  musculacion:   { label: "Musculación",         short: "Fuerza",     icon: Dumbbell  },
  cardio_liss:   { label: "Cardio Tradicional",  short: "Cardio",     icon: HeartPulse },
  cardio_hiit:   { label: "HIIT",                short: "HIIT",       icon: Zap       },
  cardio_custom: { label: "Intervalos",          short: "Intervalos", icon: Repeat2   },
}
