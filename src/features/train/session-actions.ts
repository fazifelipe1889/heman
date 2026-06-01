"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  saveMusculacionSession,
  type SaveMusculacionSessionInput,
} from "@/lib/db/sessions"

export type SaveSessionResult = { error?: string; sessionId?: string }

export async function saveMusculacionSessionAction(
  input: SaveMusculacionSessionInput
): Promise<SaveSessionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!input?.name || !Array.isArray(input.exercises)) {
    return { error: "Datos inválidos." }
  }

  try {
    const sessionId = await saveMusculacionSession(supabase, user.id, input)
    revalidatePath("/progress")
    return { sessionId }
  } catch {
    return { error: "No se pudo guardar el entrenamiento." }
  }
}
