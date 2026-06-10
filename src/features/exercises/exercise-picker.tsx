"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  Plus,
  BookmarkPlus,
  Trash2,
  Dumbbell,
  Loader2,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Exercise, DifficultyEs } from "@/lib/domain/exercises"
import {
  MUSCLE_GROUPS_ES,
  MUSCLE_GROUP_SECTIONS,
  EQUIPMENT_ES,
  DIFFICULTIES_ES,
  DIFFICULTY_COLORS,
} from "@/lib/domain/exercises"
import { searchExercises } from "@/lib/domain/exercise-search"
import { createCustomExercise, deleteCustomExercise } from "@/lib/db/exercises"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

/** Prefijo del ref para ejercicios temporales (solo esta rutina, sin DB). */
function tempRef(): string {
  return `custom_temp_${Date.now().toString(36)}`
}

// ─── Hook: carga todos los ejercicios una sola vez ─────────────────────────────

function useAllExercises() {
  const [exercises, setExercises] = React.useState<Exercise[]>([])
  const [loading, setLoading] = React.useState(false)
  const [tableMissing, setTableMissing] = React.useState(false)
  const loaded = React.useRef(false)

  const load = React.useCallback(async () => {
    if (loaded.current) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name")
      .limit(600)
    if (error) {
      // Resiliencia: si la tabla no existe todavía, el picker sigue funcionando
      // (vacío) y la creación se deshabilita con aviso "Próximamente".
      setTableMissing(true)
      setLoading(false)
      return
    }
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

  // Optimistic helpers para creación/eliminación de custom.
  const addExercise = React.useCallback((ex: Exercise) => {
    setExercises((prev) =>
      [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  const removeExercise = React.useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { exercises, loading, tableMissing, load, addExercise, removeExercise }
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
  onDelete,
}: {
  ex: Exercise
  onSelect: () => void
  onDelete?: () => void
}) {
  const diffColor =
    DIFFICULTY_COLORS[ex.difficulty as DifficultyEs] ??
    "bg-muted/50 text-muted-foreground border-border"
  const isCustom = Boolean(ex.created_by)

  return (
    <div className="relative flex items-stretch">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 active:bg-muted/60"
      >
        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium leading-snug">{ex.name}</span>
          <div className="flex flex-wrap gap-1">
            {isCustom && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                <Dumbbell className="size-2.5" /> Mío
              </span>
            )}
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              {ex.primary_muscle_group}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {ex.equipment}
            </span>
            {!isCustom && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${diffColor}`}
              >
                {ex.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Imagen */}
        {ex.image_url ? (
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
            <img
              src={ex.image_url}
              alt={ex.name}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground/30">
            <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current stroke-[1.5]">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-5-5L5 19" />
            </svg>
          </div>
        )}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar ${ex.name}`}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Formulario inline de creación ─────────────────────────────────────────────

function CreateExerciseForm({
  initialName,
  saving,
  onSavePersistent,
  onSaveTemporary,
}: {
  initialName: string
  saving: boolean
  onSavePersistent: (data: {
    name: string
    muscleGroup: string
    equipment: string
    description: string
  }) => void
  onSaveTemporary: (name: string) => void
}) {
  const [name, setName] = React.useState(initialName)
  const [muscleGroup, setMuscleGroup] = React.useState("")
  const [equipment, setEquipment] = React.useState("")
  const [description, setDescription] = React.useState("")

  const trimmed = name.trim()
  const valid = trimmed.length > 0

  const selectClass =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Nombre del ejercicio *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Press inclinado en Smith"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Grupo muscular (opcional)
        </label>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {MUSCLE_GROUPS_ES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Equipamiento (opcional)
        </label>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {EQUIPMENT_ES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Descripción / notas (opcional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cómo se ejecuta, observaciones técnicas…"
        />
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Button
          type="button"
          disabled={!valid || saving}
          onClick={() =>
            onSavePersistent({ name: trimmed, muscleGroup, equipment, description })
          }
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BookmarkPlus className="size-4" />
          )}
          Guardar para siempre
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!valid || saving}
          onClick={() => onSaveTemporary(trimmed)}
        >
          Solo para esta rutina
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Guardar para siempre</span>{" "}
        lo agrega a <span className="font-medium">Mis ejercicios</span> para
        reutilizarlo. <span className="font-medium text-foreground">Solo para
        esta rutina</span> lo usa una vez sin guardarlo.
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ExercisePicker({ value, onPick }: Props) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"list" | "create">("list")
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const [saving, setSaving] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const {
    exercises,
    loading,
    tableMissing,
    load,
    addExercise,
    removeExercise,
  } = useAllExercises()

  // Cargar al abrir + resolver el usuario actual (para created_by).
  React.useEffect(() => {
    if (!open) return
    load()
    if (userId === null) {
      createClient()
        .auth.getUser()
        .then(({ data }) => setUserId(data.user?.id ?? null))
        .catch(() => setUserId(null))
    }
  }, [open, load, userId])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Resetear al cerrar para que la próxima apertura empiece limpia.
      setMode("list")
      setFilters(EMPTY_FILTERS)
    }
  }

  const setFilter = (k: keyof Filters, v: string) =>
    setFilters((prev) => ({ ...prev, [k]: v }))

  const clearFilters = () =>
    setFilters((prev) => ({ ...EMPTY_FILTERS, search: prev.search }))

  const filtered = React.useMemo(() => {
    // Fuzzy search + sinónimos sobre el texto; filtros duros por categoría
    const bySearch = searchExercises(exercises, filters.search)
    return bySearch.filter((ex) => {
      if (filters.muscleGroup && ex.primary_muscle_group !== filters.muscleGroup)
        return false
      if (filters.equipment && ex.equipment !== filters.equipment) return false
      if (filters.difficulty && ex.difficulty !== filters.difficulty) return false
      return true
    })
  }, [exercises, filters])

  // Separar "Mis ejercicios" (custom) del catálogo global, preservando el orden.
  const customResults = React.useMemo(
    () => filtered.filter((ex) => ex.created_by),
    [filtered],
  )
  const globalResults = React.useMemo(
    () => filtered.filter((ex) => !ex.created_by),
    [filtered],
  )

  function handlePick(ex: Exercise) {
    onPick({ id: ex.id, name: ex.name })
    handleOpenChange(false)
  }

  function openCreate() {
    if (tableMissing) {
      toast.info("La creación de ejercicios estará disponible próximamente.")
      return
    }
    setMode("create")
  }

  async function handleSavePersistent(data: {
    name: string
    muscleGroup: string
    equipment: string
    description: string
  }) {
    if (!userId) {
      toast.error("Tenés que iniciar sesión para guardar ejercicios.")
      return
    }
    setSaving(true)
    try {
      const created = await createCustomExercise(createClient(), userId, {
        name: data.name,
        primaryMuscleGroup: data.muscleGroup || undefined,
        equipment: data.equipment || undefined,
        instructions: data.description || undefined,
      })
      addExercise(created)
      toast.success("Ejercicio guardado en «Mis ejercicios»")
      handlePick(created)
    } catch {
      toast.error("No se pudo guardar el ejercicio. Intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  function handleSaveTemporary(name: string) {
    // Solo estado local: no toca la DB. El ref temporal distingue estos casos.
    onPick({ id: tempRef(), name })
    handleOpenChange(false)
  }

  async function handleDelete(ex: Exercise) {
    if (!window.confirm(`¿Eliminar «${ex.name}» de tus ejercicios?`)) return
    removeExercise(ex.id) // optimista
    try {
      await deleteCustomExercise(createClient(), ex.id)
      toast.success("Ejercicio eliminado")
    } catch {
      addExercise(ex) // revertir
      toast.error("No se pudo eliminar el ejercicio.")
    }
  }

  const label = value || "Elegí un ejercicio"
  const hasValue = Boolean(value)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        {mode === "create" ? (
          <>
            {/* Header creación */}
            <div className="flex items-center gap-2 border-b px-4 pt-4 pb-3">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Volver"
              >
                <ChevronLeft className="size-4" />
              </button>
              <DialogTitle>Crear ejercicio</DialogTitle>
            </div>
            <CreateExerciseForm
              initialName={filters.search}
              saving={saving}
              onSavePersistent={handleSavePersistent}
              onSaveTemporary={handleSaveTemporary}
            />
          </>
        ) : (
          <>
            {/* Header fijo */}
            <div className="flex flex-col gap-3 border-b px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle>Seleccionar ejercicio</DialogTitle>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
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

              <div className="flex items-center justify-between gap-2">
                <FilterPanel
                  filters={filters}
                  setFilter={setFilter}
                  onClear={clearFilters}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={openCreate}
                >
                  <Plus className="size-4" /> Crear
                </Button>
              </div>
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
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {tableMissing ? "Catálogo no disponible" : "Sin resultados"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openCreate}
                  >
                    <Plus className="size-4" />
                    {filters.search
                      ? `Crear «${filters.search.trim()}»`
                      : "Crear ejercicio"}
                  </Button>
                  {!tableMissing && (filters.muscleGroup || filters.equipment || filters.difficulty) && (
                    <button
                      type="button"
                      onClick={() => setFilters(EMPTY_FILTERS)}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Mis ejercicios (custom) */}
                  {customResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mis ejercicios
                      </p>
                      {customResults.map((ex) => (
                        <ExerciseRow
                          key={ex.id}
                          ex={ex}
                          onSelect={() => handlePick(ex)}
                          onDelete={() => handleDelete(ex)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Catálogo global */}
                  {globalResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {customResults.length > 0 && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Catálogo
                        </p>
                      )}
                      <p className="mb-1 text-xs text-muted-foreground">
                        {globalResults.length === exercises.length
                          ? `${exercises.length} ejercicios`
                          : `${globalResults.length} de ${exercises.length}`}
                      </p>
                      {globalResults.map((ex) => (
                        <ExerciseRow
                          key={ex.id}
                          ex={ex}
                          onSelect={() => handlePick(ex)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
