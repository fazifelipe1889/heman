"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { CoachingMessage } from "@/lib/supabase/types"
import { sendMessageAction, markThreadReadAction } from "./actions"

type Props = {
  subscriptionId: string
  currentUserId: string
  initialMessages: CoachingMessage[]
  /** Si el chat no está habilitado en el plan, se muestra deshabilitado. */
  enabled: boolean
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ChatPanel({
  subscriptionId,
  currentUserId,
  initialMessages,
  enabled,
}: Props) {
  const [messages, setMessages] = React.useState<CoachingMessage[]>(initialMessages)
  const [draft, setDraft] = React.useState("")
  const [isSending, startSending] = React.useTransition()
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Append con dedupe por id.
  const upsertMessage = React.useCallback((msg: CoachingMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    )
  }, [])

  // Suscripción realtime a nuevos mensajes de esta suscripción.
  React.useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    const channel = supabase
      .channel(`coaching_chat:${subscriptionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "coaching_message",
          filter: `subscription_id=eq.${subscriptionId}`,
        },
        (payload) => {
          upsertMessage(payload.new as CoachingMessage)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [subscriptionId, enabled, upsertMessage])

  // Marcar como leído al montar.
  React.useEffect(() => {
    if (enabled) void markThreadReadAction(subscriptionId)
  }, [subscriptionId, enabled])

  // Auto-scroll al final cuando llegan mensajes.
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft("")
    startSending(async () => {
      const res = await sendMessageAction({ subscriptionId, body })
      if (res?.error) {
        setDraft(body) // restaurar si falló
      }
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      {/* Mensajes */}
      <div className="flex max-h-[60vh] min-h-48 flex-col gap-2 overflow-y-auto bg-muted/30 p-3">
        {messages.length === 0 ? (
          <p className="m-auto text-center text-sm text-muted-foreground">
            Todavía no hay mensajes. ¡Escribí el primero!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div
                key={m.id}
                className={cn("flex flex-col", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-background ring-1 ring-foreground/10"
                  )}
                >
                  {m.body}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {fmtTime(m.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {enabled ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribí un mensaje…"
            className="h-10"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0"
            disabled={isSending || !draft.trim()}
            aria-label="Enviar"
          >
            {isSending ? (
              <Spinner />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="border-t p-3 text-center text-xs text-muted-foreground">
          El chat no está incluido en este plan.
        </div>
      )}
    </div>
  )
}
