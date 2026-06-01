"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  addPlanDayRoutine,
  clearPlanDay,
  ensureActivePlan,
  removePlanDay,
} from "@/lib/db/plans"

export async function addPlanDayRoutineAction(
  dayOfWeek: number,
  routineId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const planId = await ensureActivePlan(supabase, user.id)
  await addPlanDayRoutine(supabase, planId, dayOfWeek, routineId)

  revalidatePath("/plan")
  revalidatePath("/train")
}

export async function removePlanDayAction(planDayId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await removePlanDay(supabase, planDayId)

  revalidatePath("/plan")
  revalidatePath("/train")
}

export async function clearPlanDayAction(dayOfWeek: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const planId = await ensureActivePlan(supabase, user.id)
  await clearPlanDay(supabase, planId, dayOfWeek)

  revalidatePath("/plan")
  revalidatePath("/train")
}
