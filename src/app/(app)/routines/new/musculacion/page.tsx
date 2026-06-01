import type { Metadata } from "next"

import { MusculacionBuilder } from "@/features/routines/musculacion/musculacion-builder"

export const metadata: Metadata = {
  title: "Crear rutina de musculación — EPHA",
}

export default function NewMusculacionPage() {
  return <MusculacionBuilder />
}
