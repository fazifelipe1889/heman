"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  createCustomIntervalRoutine,
  createHiitRoutine,
  createLissRoutine,
  createMusculacionRoutine,
  deleteRoutine,
  setFavorite,
} from "@/lib/db/routines"
import { musculacionSchema, type MusculacionFormValues } from "./musculacion/schema"
import {
  customIntervalSchema,
  hiitSchema,
  lissSchema,
  type CustomIntervalFormValues,
  type HiitFormValues,
  type LissFormValues,
} from "./cardio/schema"

export type SaveResult = { error?: string }

async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, userId: user.id }
}

export async function createMusculacionAction(
  values: MusculacionFormValues
): Promise<SaveResult> {
  const parsed = musculacionSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la rutina." }

  const { supabase, userId } = await requireUserId()
  const v = parsed.data

  let id: string
  try {
    id = await createMusculacionRoutine(supabase, userId, {
      name: v.name,
      description: v.description || null,
      goal: v.goal ?? null,
      experienceLevel: v.experienceLevel ?? null,
      exercises: v.exercises.map((e) => ({
        exerciseName: e.exerciseName,
        exerciseRef: e.exerciseRef || null,
        sets: e.sets,
        targetReps: e.targetReps || null,
        targetWeight: e.targetWeight ?? null,
        targetRir: e.targetRir ?? null,
        restSeconds: e.restSeconds ?? null,
        notes: e.notes || null,
      })),
    })
  } catch {
    return { error: "No se pudo guardar la rutina." }
  }

  revalidatePath("/routines")
  redirect(`/routines/${id}`)
}

export async function createLissAction(
  values: LissFormValues
): Promise<SaveResult> {
  const parsed = lissSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la rutina." }

  const { supabase, userId } = await requireUserId()
  const v = parsed.data

  let id: string
  try {
    id = await createLissRoutine(supabase, userId, {
      name: v.name,
      description: v.description || null,
      modality: v.modality || null,
      durationMin: v.durationMin ?? null,
      intensity: v.intensity || null,
      incline: v.incline ?? null,
      speed: v.speed ?? null,
      distanceKm: v.distanceKm ?? null,
      targetCalories: v.targetCalories ?? null,
      weeklyFrequency: v.weeklyFrequency ?? null,
    })
  } catch {
    return { error: "No se pudo guardar la rutina." }
  }

  revalidatePath("/routines")
  redirect(`/routines/${id}`)
}

export async function createHiitAction(
  values: HiitFormValues
): Promise<SaveResult> {
  const parsed = hiitSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la rutina." }

  const { supabase, userId } = await requireUserId()
  const v = parsed.data

  let id: string
  try {
    id = await createHiitRoutine(supabase, userId, {
      name: v.name,
      description: v.description || null,
      mainExercise: v.mainExercise || null,
      rounds: v.rounds ?? null,
      workSeconds: v.workSeconds ?? null,
      restSeconds: v.restSeconds ?? null,
      intervals: v.intervals ?? null,
      intensity: v.intensity || null,
    })
  } catch {
    return { error: "No se pudo guardar la rutina." }
  }

  revalidatePath("/routines")
  redirect(`/routines/${id}`)
}

export async function createCustomIntervalAction(
  values: CustomIntervalFormValues
): Promise<SaveResult> {
  const parsed = customIntervalSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos de la rutina." }

  const { supabase, userId } = await requireUserId()
  const v = parsed.data

  let id: string
  try {
    id = await createCustomIntervalRoutine(supabase, userId, {
      name: v.name,
      description: v.description || null,
      rounds: v.rounds ?? 1,
      blocks: v.blocks.map((b) => ({
        name: b.name,
        durationSeconds: b.durationSeconds,
        intensity: b.intensity || null,
      })),
    })
  } catch {
    return { error: "No se pudo guardar la rutina." }
  }

  revalidatePath("/routines")
  redirect(`/routines/${id}`)
}

export async function setFavoriteAction(id: string, value: boolean) {
  const { supabase } = await requireUserId()
  await setFavorite(supabase, id, value)
  revalidatePath("/routines")
}

export async function deleteRoutineAction(id: string) {
  const { supabase } = await requireUserId()
  await deleteRoutine(supabase, id)
  revalidatePath("/routines")
  redirect("/routines")
}
