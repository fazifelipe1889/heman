"use client"

import * as React from "react"
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Exercise, DifficultyEs } from "@/lib/domain/exercises"
import {
  MUSCLE_GROUP_SECTIONS,
  EQUIPMENT_ES,
  DIFFICULTIES_ES,
  DIFFICULTY_COLORS,
} from "@/lib/domain/exercises"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PickedExercise = {
  id: string
  name: string
}

type Props = {
  value: string          // nombre actual
  onPick: (ex: PickedExercise) => void
}

type Filters = {
  search: string
  muscleGroup: string
  equipment: string
  difficulty: string
}

const EMPTY_FILTERS: Filters = {
  search: "",
  muscleGroup: "",
  equipment: "",
  difficulty: "",
}

// ─── Hook: carga todos los ejercicios una sola vez ─────────────────────────────

function useAllExercises() {
  const [exercises, setExercises] = React.useState<Exercise[]>([])
  const [loading, setLoading] = React.useState(false)
  const loaded = React.useRef(false)

  const load = React.useCallback(async () => {
    if (loaded.current) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .order("name")
      .limit(600)
    if (data) {
      setTimeout(() => {
        setExercises(data as Exercise[])
        loaded.current = true
        setLoading(false)
      }, 0)
    } else {
      setLoading(false)
    }
  }, [])

  return { exercises, loading, load }
}

// ─── Panel de filtros desplegable ─────────────────────────────────────────────

function FilterPanel({
  filters,
  setFilter,
  onClear,
}: {
  filters: Filters
  setFilter: (k: keyof Filters, v: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const activeCount = [filters.muscleGroup, filters.equipment, filters.difficulty].filter(
    Boolean,
  ).length

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <SlidersHorizontal className="size-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
          {/* Grupo muscular */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Grupo muscular
            </p>
            <div className="flex flex-col gap-2">
              {MUSCLE_GROUP_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {section.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {section.values.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setFilter(
                            "muscleGroup",
                            filters.muscleGroup === v ? "" : v,
                          )
                        }
                        className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                          filters.muscleGroup === v
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipamiento */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Equipamiento
            </p>
            <div className="flex flex-wrap gap-1">
              {EQUIPMENT_ES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() =>
                    setFilter("equipment", filters.equipment === e ? "" : e)
                  }
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    filters.equipment === e
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Dificultad */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dificultad
            </p>
            <div className="flex gap-1.5">
              {DIFFICULTIES_ES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    setFilter("difficulty", filters.difficulty === d ? "" : d)
                  }
                  className={`flex-1 rounded-lg border py-1 text-[11px] font-medium transition-colors ${
                    filters.difficulty === d
                      ? DIFFICULTY_COLORS[d]
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 self-start text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              <X className="size-3" /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fila de resultado ────────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  onSelect,
}: {
  ex: Exercise
  onSelect: () => void
}) {
  const diffColor =
    DIFFICULTY_COLORS[ex.difficulty as DifficultyEs] ??
    "bg-muted/50 text-muted-foreground border-border"

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-1 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 active:bg-muted/60"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug">{ex.name}</span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${diffColor}`}
        >
          {ex.difficulty}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
          {ex.primary_muscle_group}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          {ex.equipment}
        </span>
      </div>
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ExercisePicker({ value, onPick }: Props) {
  const [open, setOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const { exercises, loading, load } = useAllExercises()

  // Cargar al abrir
  React.useEffect(() => {
    if (open) load()
  }, [open, load])

  const setFilter = (k: keyof Filters, v: string) =>
    setFilters((prev) => ({ ...prev, [k]: v }))

  const clearFilters = () =>
    setFilters((prev) => ({ ...EMPTY_FILTERS, search: prev.search }))

  const filtered = React.useMemo(() => {
    return exercises.filter((ex) => {
      if (
        filters.search &&
        !ex.name.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false
      if (filters.muscleGroup && ex.primary_muscle_group !== filters.muscleGroup)
        return false
      if (filters.equipment && ex.equipment !== filters.equipment) return false
      if (filters.difficulty && ex.difficulty !== filters.difficulty) return false
      return true
    })
  }, [exercises, filters])

  function handlePick(ex: Exercise) {
    onPick({ id: ex.id, name: ex.name })
    setOpen(false)
    setFilters(EMPTY_FILTERS)
  }

  const label = value || "Elegí un ejercicio"
  const hasValue = Boolean(value)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={`flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors hover:border-primary/50 ${
              hasValue
                ? "border-border bg-background font-medium text-foreground"
                : "border-border bg-background text-muted-foreground"
            }`}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header fijo */}
        <div className="flex flex-col gap-3 border-b px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle>Seleccionar ejercicio</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9"
              autoFocus
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <FilterPanel
            filters={filters}
            setFilter={setFilter}
            onClear={clearFilters}
          />
        </div>

        {/* Lista scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">Sin resultados</p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-xs text-muted-foreground">
                {filtered.length === exercises.length
                  ? `${exercises.length} ejercicios`
                  : `${filtered.length} de ${exercises.length}`}
              </p>
              {filtered.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  onSelect={() => handlePick(ex)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
