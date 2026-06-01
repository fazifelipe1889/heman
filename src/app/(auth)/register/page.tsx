import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/register-form"

export const metadata: Metadata = {
  title: "Crear cuenta — EPHA",
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Creá tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Empezá a planificar y registrar tus entrenamientos.
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
