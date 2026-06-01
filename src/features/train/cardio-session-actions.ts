"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  saveCardioSession,
  type SaveCardioSessionInput,
} from "@/lib/db/sessions"

export type SaveCardioResult = { error?: string; sessionId?: string }

export async function saveCardioSessionAction(
  input: SaveCardioSessionInput
): Promise<SaveCardioResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    const sessionId = await saveCardioSession(supabase, user.id, input)
    revalidatePath("/progress")
    return { sessionId }
  } catch {
    return { error: "No se pudo guardar la sesión." }
  }
}
