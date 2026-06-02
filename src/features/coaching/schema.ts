import { z } from "zod"

import { ATTACHMENT_TYPES } from "@/lib/domain/coaching"

/**
 * Schemas de formulario del lado usuario del coaching (chat, reseñas).
 */

export const sendMessageSchema = z
  .object({
    subscriptionId: z.string().uuid(),
    body: z.string().max(4000).optional(),
    attachmentUrl: z.string().url().optional(),
    attachmentType: z.enum(ATTACHMENT_TYPES).optional(),
  })
  .refine((v) => (v.body && v.body.trim().length > 0) || v.attachmentUrl, {
    message: "Escribí un mensaje o adjuntá un archivo.",
    path: ["body"],
  })

export type SendMessageValues = z.infer<typeof sendMessageSchema>

export const reviewSchema = z.object({
  subscriptionId: z.string().uuid(),
  rating: z.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.string().max(2000).optional(),
  // 1 imagen opcional. La subida real (Storage) se cablea en una etapa posterior.
  imageUrl: z.string().url().optional(),
})

export type ReviewValues = z.infer<typeof reviewSchema>

export const intakeAnswersSchema = z.object({
  subscriptionId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
})

export type IntakeAnswersValues = z.infer<typeof intakeAnswersSchema>

export const adaptiveExercisesSchema = z.object({
  routineId: z.string().uuid(),
  exercises: z.array(
    z.object({
      exerciseName: z.string().min(1).max(200),
      exerciseRef: z.string().nullable(),
      sets: z.number().int().min(1).max(20),
      notes: z.string().nullable(),
    })
  ),
})

export type AdaptiveExercisesValues = z.infer<typeof adaptiveExercisesSchema>
