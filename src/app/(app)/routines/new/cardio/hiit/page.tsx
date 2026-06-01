import type { Metadata } from "next"

import { HiitForm } from "@/features/routines/cardio/hiit-form"

export const metadata: Metadata = {
  title: "Crear cardio HIIT — EPHA",
}

export default function NewHiitPage() {
  return <HiitForm />
}
