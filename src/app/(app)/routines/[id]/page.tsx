import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getRoutineDetail } from "@/lib/db/routines"
import { ROUTINE_TYPE_META } from "@/features/routines/routine-type"
import { RoutineActions } from "@/features/routines/routine-actions"
import {
  CARDIO_MODALITIES,
  INTENSITIES,
  labelFor,
} from "@/lib/domain/training"
import { EXPERIENCE_LABELS, GOAL_LABELS } from "@/lib/domain/labels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Rutina — EPHA",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-muted/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const routine = await getRoutineDetail(supabase, id)
  if (!routine) notFound()

  const meta = ROUTINE_TYPE_META[routine.type]
  const Icon = meta.icon

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/routines"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Rutinas
        </Link>
        <RoutineActions id={routine.id} isFavorite={routine.is_favorite} />
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{routine.name}</h1>
          <Badge variant="secondary" className="w-fit">
            {meta.label}
          </Badge>
        </div>
      </div>

      {routine.description && (
        <p className="text-sm text-muted-foreground">{routine.description}</p>
      )}

      {/* ----- Musculación ----- */}
      {routine.type === "musculacion" && (
        <>
          {(routine.goal || routine.experience_level) && (
            <div className="grid grid-cols-2 gap-2">
              {routine.goal && (
                <Stat label="Objetivo" value={GOAL_LABELS[routine.goal]} />
              )}
              {routine.experience_level && (
                <Stat
                  label="Nivel"
                  value={EXPERIENCE_LABELS[routine.experience_level]}
                />
              )}
            </div>
          )}

          {routine.exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ejercicios.</p>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-4">
                {routine.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{ex.exercise_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {ex.sets} series
                        {ex.target_reps ? ` × ${ex.target_reps}` : ""}
                        {ex.rest_seconds ? ` · ${ex.rest_seconds}s desc.` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {ex.target_weight != null && (
                        <Badge variant="outline">{ex.target_weight} kg</Badge>
                      )}
                      {ex.target_rir != null && (
                        <Badge variant="outline">RIR {ex.target_rir}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ----- Cardio LISS ----- */}
      {routine.type === "cardio_liss" && routine.liss && (
        <div className="grid grid-cols-2 gap-2">
          {routine.liss.modality && (
            <Stat
              label="Modalidad"
              value={labelFor(CARDIO_MODALITIES, routine.liss.modality)}
            />
          )}
          {routine.liss.duration_min != null && (
            <Stat label="Duración" value={`${routine.liss.duration_min} min`} />
          )}
          {routine.liss.intensity && (
            <Stat
              label="Intensidad"
              value={labelFor(INTENSITIES, routine.liss.intensity)}
            />
          )}
          {routine.liss.incline != null && (
            <Stat label="Inclinación" value={`${routine.liss.incline}%`} />
          )}
          {routine.liss.speed != null && (
            <Stat label="Velocidad" value={`${routine.liss.speed} km/h`} />
          )}
          {routine.liss.distance_km != null && (
            <Stat label="Distancia" value={`${routine.liss.distance_km} km`} />
          )}
          {routine.liss.target_calories != null && (
            <Stat label="Calorías" value={routine.liss.target_calories} />
          )}
          {routine.liss.weekly_frequency != null && (
            <Stat
              label="Frec. semanal"
              value={`${routine.liss.weekly_frequency}×`}
            />
          )}
        </div>
      )}

      {/* ----- Intervalos personalizados ----- */}
      {routine.type === "cardio_custom" && (
        <>
          {routine.customConfig?.rounds && routine.customConfig.rounds > 1 && (
            <Stat label="Rondas" value={`${routine.customConfig.rounds}×`} />
          )}
          {routine.blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin bloques.</p>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-0 pt-4">
                {routine.blocks.map((b, i) => {
                  const m = Math.floor(b.duration_seconds / 60)
                  const s = b.duration_seconds % 60
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{b.name}</span>
                        {b.intensity && (
                          <span className="text-xs text-muted-foreground">
                            {labelFor(INTENSITIES, b.intensity)}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Badge variant="outline">
                          {m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ----- Cardio HIIT ----- */}
      {routine.type === "cardio_hiit" && routine.hiit && (
        <>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex items-stretch gap-3 pt-6 text-center">
              <div className="flex flex-1 flex-col">
                <span className="text-3xl font-bold tabular-nums">
                  {routine.hiit.work_seconds ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  Trabajo (s)
                </span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-3xl font-bold tabular-nums">
                  {routine.hiit.rest_seconds ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  Descanso (s)
                </span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-3xl font-bold tabular-nums">
                  {routine.hiit.rounds ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  Rondas
                </span>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            {routine.hiit.main_exercise && (
              <Stat label="Ejercicio" value={routine.hiit.main_exercise} />
            )}
            {routine.hiit.intensity && (
              <Stat
                label="Intensidad"
                value={labelFor(INTENSITIES, routine.hiit.intensity)}
              />
            )}
            {routine.hiit.intervals != null && (
              <Stat label="Intervalos" value={routine.hiit.intervals} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
