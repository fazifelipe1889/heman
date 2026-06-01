import type { Metadata } from "next"

import { BodyReviewForm } from "@/features/progress/body-review-form"

export const metadata: Metadata = {
  title: "Nueva revisión — EPHA",
}

export default function NewReviewPage() {
  return <BodyReviewForm />
}
