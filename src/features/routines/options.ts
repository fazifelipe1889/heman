import { EXPERIENCE_LEVELS, GOALS, MUSCLE_GROUPS } from "@/lib/domain/enums"
import {
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  MUSCLE_GROUP_LABELS,
} from "@/lib/domain/labels"
import type { Option } from "@/lib/domain/training"

export const GOAL_OPTIONS: Option[] = GOALS.map((v) => ({
  value: v,
  label: GOAL_LABELS[v],
}))

export const EXPERIENCE_OPTIONS: Option[] = EXPERIENCE_LEVELS.map((v) => ({
  value: v,
  label: EXPERIENCE_LABELS[v],
}))

export const MUSCLE_OPTIONS: Option[] = MUSCLE_GROUPS.map((v) => ({
  value: v,
  label: MUSCLE_GROUP_LABELS[v],
}))
