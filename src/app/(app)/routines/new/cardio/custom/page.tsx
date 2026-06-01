import type { Metadata } from "next"
import { CustomIntervalForm } from "@/features/routines/cardio/custom-form"

export const metadata: Metadata = {
  title: "Intervalos personalizados — EPHA",
}

export default function NewCustomIntervalPage() {
  return <CustomIntervalForm />
}
