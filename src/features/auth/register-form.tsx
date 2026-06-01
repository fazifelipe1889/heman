"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { signUpAction } from "./actions"
import { signUpSchema, type SignUpValues } from "./schemas"

export function RegisterForm() {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = React.useState(false)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", acceptedTerms: undefined },
  })

  function onSubmit(values: SignUpValues) {
    setFormError(null)
    startTransition(async () => {
      const res = await signUpAction(values)
      if (res?.error) setFormError(res.error)
      else if (res?.needsConfirmation) setConfirmationSent(true)
    })
  }

  if (confirmationSent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Revisá tu email</h2>
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace de confirmación a{" "}
          <span className="font-medium text-foreground">
            {form.getValues("email")}
          </span>
          . Confirmá tu cuenta para continuar.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {formError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormDescription>Mínimo 8 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Aceptar términos y política */}
        <FormField
          control={form.control}
          name="acceptedTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  checked={field.value === true}
                  onChange={(e) =>
                    field.onChange(e.target.checked ? true : undefined)
                  }
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                />
                <label
                  htmlFor="acceptedTerms"
                  className="cursor-pointer text-sm text-muted-foreground leading-snug"
                >
                  Acepto los{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-12 text-base"
          disabled={isPending}
        >
          {isPending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </Form>
  )
}
