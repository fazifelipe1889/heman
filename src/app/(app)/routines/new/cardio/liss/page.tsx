import type { Metadata } from "next"

import { LissForm } from "@/features/routines/cardio/liss-form"

export const metadata: Metadata = {
  title: "Crear cardio LISS — EPHA",
}

export default function NewLissPage() {
  return <LissForm />
}
