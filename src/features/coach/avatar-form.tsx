"use client"

import * as React from "react"
import { toast } from "sonner"
import { UserCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CoachProfile } from "@/lib/supabase/types"
import { getInitials } from "@/lib/domain/coaching"
import { updateCoachAvatarAction } from "./actions"

export function AvatarForm({ coach }: { coach: CoachProfile }) {
  const [url, setUrl] = React.useState(coach.avatar_url ?? "")
  const [preview, setPreview] = React.useState(coach.avatar_url ?? "")
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateCoachAvatarAction(url.trim())
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setPreview(url.trim())
      toast.success("Foto actualizada")
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="flex flex-col items-center gap-5 pt-6">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-bold ring-4 ring-card">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-full object-cover" />
            ) : coach.display_name ? (
              getInitials(coach.display_name)
            ) : (
              <UserCircle2 className="size-10 text-muted-foreground" />
            )}
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="avatar-url">URL de la foto de perfil</Label>
            <Input
              id="avatar-url"
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cuadrada (1:1). Recomendado: 400×400 px.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar foto"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
