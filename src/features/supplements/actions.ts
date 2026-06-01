"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  createSupplement,
  deleteSupplement,
  markTaken,
  markUntaken,
  updateSupplement,
} from "@/lib/db/supplements"

export async function createSupplementAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const name = String(formData.get("name") ?? "").trim()
  if (!name) return { error: "El nombre es requerido" }

  const dose = String(formData.get("dose") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const color = String(formData.get("color") ?? "blue")

  const rawDays = formData.getAll("days_of_week")
  const days_of_week = rawDays.map(Number)
  if (days_of_week.length === 0) return { error: "Seleccioná al menos un día" }

  const rawTimes = formData.getAll("times_of_day")
  const times_of_day = rawTimes.map(String)

  const result = await createSupplement(supabase, user.id, {
    name,
    dose,
    notes,
    days_of_week,
    times_of_day,
    color,
  })

  if (!result) return { error: "No se pudo guardar el suplemento" }

  revalidatePath("/supplements")
  return { id: result.id }
}

export async function updateSupplementAction(
  id: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) return { error: "El nombre es requerido" }

  const dose = String(formData.get("dose") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const color = String(formData.get("color") ?? "blue")
  const rawDays = formData.getAll("days_of_week")
  const days_of_week = rawDays.map(Number)
  const rawTimes = formData.getAll("times_of_day")
  const times_of_day = rawTimes.map(String)

  const ok = await updateSupplement(supabase, id, {
    name,
    dose,
    notes,
    days_of_week,
    times_of_day,
    color,
  })

  if (!ok) return { error: "No se pudo actualizar" }
  revalidatePath("/supplements")
  return {}
}

export async function deleteSupplementAction(id: string) {
  const supabase = await createClient()
  await deleteSupplement(supabase, id)
  revalidatePath("/supplements")
}

export async function toggleSupplementLogAction(
  supplementId: string,
  logDate: string,
  currentlyTaken: boolean,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  if (currentlyTaken) {
    await markUntaken(supabase, supplementId, logDate)
  } else {
    await markTaken(supabase, user.id, supplementId, logDate)
  }

  revalidatePath("/supplements")
}
