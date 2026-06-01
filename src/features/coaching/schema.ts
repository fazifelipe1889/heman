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
})

export type ReviewValues = z.infer<typeof reviewSchema>
