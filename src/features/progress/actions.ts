"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createBodyReview, deleteBodyReview } from "@/lib/db/progress"
import type { BodyReviewInsert } from "@/lib/db/progress"

export async function createBodyReviewAction(
  input: Omit<BodyReviewInsert, "user_id">
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    await createBodyReview(supabase, user.id, input)
    revalidatePath("/progress")
    return {}
  } catch {
    return { error: "No se pudo guardar la revisión." }
  }
}

export async function deleteBodyReviewAction(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    await deleteBodyReview(supabase, id)
    revalidatePath("/progress")
    return {}
  } catch {
    return { error: "No se pudo eliminar la revisión." }
  }
}
