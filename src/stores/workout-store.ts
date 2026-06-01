import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type WorkoutSetRow = {
  targetReps: string | null
  targetWeight: number | null
  targetRir: number | null
  actualReps: number | undefined
  actualWeight: number | undefined
  actualRir: number | undefined
  completed: boolean
}

export type WorkoutExRow = {
  name: string
  ref: string | null
  restSeconds: number
  notes: string
  sets: WorkoutSetRow[]
}

type WorkoutStore = {
  isActive: boolean
  routineId: string
  routineName: string
  startTime: number          // Date.now() at start — no toques en render
  exercises: WorkoutExRow[]
  selectedExIndex: number
  restEndTime: number | null  // timestamp absoluto cuando termina el descanso

  // Acciones
  startWorkout: (data: {
    routineId: string
    routineName: string
    exercises: WorkoutExRow[]
  }) => void
  endWorkout: () => void
  setSelectedEx: (i: number) => void
  updateSet: (exI: number, setI: number, patch: Partial<WorkoutSetRow>) => void
  toggleSet: (exI: number, setI: number) => void
  addSet: (exI: number) => void
  removeSet: (exI: number, setI: number) => void
  setNote: (exI: number, note: string) => void
  clearRest: () => void
  extendRest: (seconds: number) => void
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      isActive: false,
      routineId: "",
      routineName: "",
      startTime: 0,
      exercises: [],
      selectedExIndex: 0,
      restEndTime: null,

      startWorkout: (data) =>
        set({
          isActive: true,
          routineId: data.routineId,
          routineName: data.routineName,
          startTime: Date.now(),
          exercises: data.exercises,
          selectedExIndex: 0,
          restEndTime: null,
        }),

      endWorkout: () =>
        set({
          isActive: false,
          routineId: "",
          routineName: "",
          startTime: 0,
          exercises: [],
          selectedExIndex: 0,
          restEndTime: null,
        }),

      setSelectedEx: (i) => set({ selectedExIndex: i }),

      updateSet: (exI, setI, patch) =>
        set((s) => ({
          exercises: s.exercises.map((ex, i) =>
            i !== exI
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((row, j) =>
                    j !== setI ? row : { ...row, ...patch }
                  ),
                }
          ),
        })),

      toggleSet: (exI, setI) => {
        const { exercises } = get()
        const willComplete = !exercises[exI].sets[setI].completed
        const restSec = exercises[exI].restSeconds
        set((s) => ({
          exercises: s.exercises.map((ex, i) =>
            i !== exI
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((row, j) =>
                    j !== setI ? row : { ...row, completed: willComplete }
                  ),
                }
          ),
          restEndTime: willComplete
            ? Date.now() + restSec * 1000
            : s.restEndTime,
        }))
      },

      addSet: (exI) =>
        set((s) => ({
          exercises: s.exercises.map((ex, i) => {
            if (i !== exI) return ex
            const last = ex.sets.at(-1)
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  targetReps: last?.targetReps ?? null,
                  targetWeight: last?.targetWeight ?? null,
                  targetRir: last?.targetRir ?? null,
                  actualReps: last?.actualReps,
                  actualWeight: last?.actualWeight,
                  actualRir: undefined,
                  completed: false,
                },
              ],
            }
          }),
        })),

      removeSet: (exI, setI) =>
        set((s) => ({
          exercises: s.exercises.map((ex, i) =>
            i !== exI
              ? ex
              : { ...ex, sets: ex.sets.filter((_, j) => j !== setI) }
          ),
        })),

      setNote: (exI, note) =>
        set((s) => ({
          exercises: s.exercises.map((ex, i) =>
            i !== exI ? ex : { ...ex, notes: note }
          ),
        })),

      clearRest: () => set({ restEndTime: null }),

      extendRest: (seconds) =>
        set((s) => ({
          restEndTime: s.restEndTime
            ? s.restEndTime + seconds * 1000
            : Date.now() + seconds * 1000,
        })),
    }),
    {
      name: "heman-active-workout",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return localStorage
        // SSR fallback vacío
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)
