"use client"

import * as React from "react"
import { Dumbbell, Search, SlidersHorizontal, X } from "lucide-react"

import type { Exercise, DifficultyEs } from "@/lib/domain/exercises"
import {
  MUSCLE_GROUP_SECTIONS,
  EQUIPMENT_ES,
  DIFFICULTIES_ES,
  DIFFICULTY_COLORS,
} from "@/lib/domain/exercises"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Filters = {
  search: string
  muscleGroup: string
  equipment: string
  difficulty: string
}

// ─── Tarjeta de ejercicio ────────────────────────────────────────────────────

function ExerciseThumb({ ex }: { ex: Exercise }) {
  const [failed, setFailed] = React.useState(false)
  const showImage = ex.image_url && !failed

  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
      {showImage ? (
        <img
          src={ex.image_url!}
          alt={ex.name}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Dumbbell className="size-6 text-muted-foreground/60" />
      )}
    </div>
  )
}

function ExerciseCard({ ex }: { ex: Exercise }) {
  const diffColor =
    DIFFICULTY_COLORS[ex.difficulty as DifficultyEs] ??
    "bg-muted text-muted-foreground border-border"

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/50">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Nombre + nivel debajo */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-medium leading-snug">{ex.name}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${diffColor}`}
          >
            {ex.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="rounded-full text-[11px] text-primary border-primary/30">
            {ex.primary_muscle_group}
          </Badge>
          <Badge variant="outline" className="rounded-full text-[11px] text-muted-foreground">
            {ex.equipment}
          </Badge>
        </div>

        {ex.secondary_muscle_groups.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Secundarios:{" "}
            {ex.secondary_muscle_groups.slice(0, 3).join(", ")}
            {ex.secondary_muscle_groups.length > 3 && " …"}
          </p>
        )}

        {ex.instructions && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {ex.instructions}
          </p>
        )}
      </div>

      {/* Imagen del ejercicio como ícono, a la derecha */}
      <ExerciseThumb ex={ex} />
    </div>
  )
}

// ─── Panel de filtros ─────────────────────────────────────────────────────────

function FiltersPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters
  onChange: (key: keyof Filters, val: string) => void
  onClear: () => void
}) {
  const hasFilters =
    filters.muscleGroup || filters.equipment || filters.difficulty

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Grupo muscular */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Grupo muscular</p>
        {MUSCLE_GROUP_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {section.values.map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    onChange("muscleGroup", filters.muscleGroup === v ? "" : v)
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
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

      {/* Equipamiento */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Equipamiento</p>
        <Select
          value={filters.equipment}
          onValueChange={(v) => onChange("equipment", !v || v === "__all__" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {EQUIPMENT_ES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dificultad */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Dificultad</p>
        <div className="flex gap-2">
          {DIFFICULTIES_ES.map((d) => (
            <button
              key={d}
              onClick={() =>
                onChange("difficulty", filters.difficulty === d ? "" : d)
              }
              className={`flex-1 rounded-xl border py-1.5 text-xs font-medium transition-colors ${
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

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
          <X className="size-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}

// ─── Browser principal ────────────────────────────────────────────────────────

export function ExerciseBrowser({ exercises }: { exercises: Exercise[] }) {
  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    muscleGroup: "",
    equipment: "",
    difficulty: "",
  })

  const setFilter = (key: keyof Filters, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: val }))

  const clearFilters = () =>
    setFilters({ search: "", muscleGroup: "", equipment: "", difficulty: "" })

  // Filtrado client-side
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

  const activeFiltersCount = [
    filters.muscleGroup,
    filters.equipment,
    filters.difficulty,
  ].filter(Boolean).length

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Ejercicios</h1>
        <p className="text-sm text-muted-foreground">
          {exercises.length} ejercicios en el catálogo
        </p>
      </div>

      {/* Barra de búsqueda + filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="pl-9"
          />
          {filters.search && (
            <button
              onClick={() => setFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="relative shrink-0">
                <SlidersHorizontal className="size-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent side="right" className="w-full max-w-xs">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
            <FiltersPanel
              filters={filters}
              onChange={setFilter}
              onClear={clearFilters}
            />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Chips de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.muscleGroup && (
            <button
              onClick={() => setFilter("muscleGroup", "")}
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
            >
              {filters.muscleGroup}
              <X className="size-3" />
            </button>
          )}
          {filters.equipment && (
            <button
              onClick={() => setFilter("equipment", "")}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {filters.equipment}
              <X className="size-3" />
            </button>
          )}
          {filters.difficulty && (
            <button
              onClick={() => setFilter("difficulty", "")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
                DIFFICULTY_COLORS[filters.difficulty as DifficultyEs]
              }`}
            >
              {filters.difficulty}
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Resultados */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === exercises.length
          ? `${filtered.length} ejercicios`
          : `${filtered.length} de ${exercises.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-muted-foreground">Sin resultados</p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} />
          ))}
        </div>
      )}
    </div>
  )
}
