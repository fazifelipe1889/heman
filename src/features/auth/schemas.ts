import { z } from "zod"

export const signInSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
})

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Ingresá tu nombre")
    .max(80, "Nombre demasiado largo"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  acceptedTerms: z.literal(true, {
    error: "Debés aceptar los Términos y la Política de Privacidad para continuar.",
  }),
})

export const verifyOtpSchema = z.object({
  email: z.email("Email inválido"),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código son 6 dígitos"),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>
