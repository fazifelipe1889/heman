"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { updateProfile } from "@/lib/db/profiles"
import { onboardingSchema, type OnboardingValues } from "./schemas"

export type OnboardingResult = { error?: string }

export async function completeOnboardingAction(
  values: OnboardingValues
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del formulario." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const v = parsed.data
  await updateProfile(supabase, user.id, {
    full_name: v.fullName,
    birth_date: v.birthDate,
    sex: v.sex,
    height_cm: v.heightCm,
    weight_kg: v.weightKg,
    goal: v.goal,
    experience_level: v.experienceLevel,
    training_days_per_week: v.trainingDaysPerWeek,
    preferred_training_type: v.preferredTrainingType,
    units: v.units,
    onboarding_completed: true,
  })

  redirect("/dashboard")
}

export async function updateProfileAction(
  values: OnboardingValues
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { error: "Revisá los datos del formulario." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const v = parsed.data
  await updateProfile(supabase, user.id, {
    full_name: v.fullName,
    birth_date: v.birthDate,
    sex: v.sex,
    height_cm: v.heightCm,
    weight_kg: v.weightKg,
    goal: v.goal,
    experience_level: v.experienceLevel,
    training_days_per_week: v.trainingDaysPerWeek,
    preferred_training_type: v.preferredTrainingType,
    units: v.units,
  })

  redirect("/settings")
}
