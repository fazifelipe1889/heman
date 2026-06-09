"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { resendOtpAction, verifyOtpAction } from "./actions"
import { verifyOtpSchema, type VerifyOtpValues } from "./schemas"

const RESEND_COOLDOWN_S = 30

export function ConfirmEmailForm({ email }: { email: string }) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [resendMsg, setResendMsg] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN_S)

  const form = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, token: "" },
  })

  // Cuenta regresiva para habilitar el reenvío.
  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  function onSubmit(values: VerifyOtpValues) {
    setFormError(null)
    setResendMsg(null)
    startTransition(async () => {
      const res = await verifyOtpAction(values)
      if (res?.error) setFormError(res.error)
      // Si tuvo éxito, verifyOtpAction redirige a /onboarding.
    })
  }

  function onResend() {
    setFormError(null)
    setResendMsg(null)
    startTransition(async () => {
      const res = await resendOtpAction(email)
      if (res?.error) {
        setFormError(res.error)
      } else {
        setResendMsg("Te enviamos un código nuevo.")
        setCooldown(RESEND_COOLDOWN_S)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Revisá tu email</h2>
        <p className="text-sm text-muted-foreground">
          Te enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-foreground">{email}</span>. Ingresalo
          para confirmar tu cuenta.
        </p>
      </div>

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
          {resendMsg && (
            <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
              {resendMsg}
            </div>
          )}

          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de confirmación</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    className="h-12 text-center text-lg tracking-[0.5em]"
                    {...field}
                  />
                </FormControl>
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
            {isPending ? "Confirmando…" : "Confirmar cuenta"}
          </Button>

          <button
            type="button"
            onClick={onResend}
            disabled={isPending || cooldown > 0}
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0
              ? `Reenviar código en ${cooldown}s`
              : "Reenviar código"}
          </button>
        </form>
      </Form>
    </div>
  )
}
