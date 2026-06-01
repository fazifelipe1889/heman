import type { Metadata } from "next"

import { LoginForm } from "@/features/auth/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión — EPHA",
}

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresá para continuar tu entrenamiento.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
