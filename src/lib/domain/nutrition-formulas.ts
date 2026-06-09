import type { IntakeField, IntakeAnswers } from "./coaching"

/** Campos de intake que se insertan automáticamente para usar /tmb y /tdee. */
export const FORMULA_INTAKE_FIELDS: IntakeField[] = [
  { id: "peso_kg", label: "Peso actual (kg)", type: "number", required: true },
  { id: "altura_cm", label: "Altura (cm)", type: "number", required: true },
  { id: "edad", label: "Edad (años)", type: "number", required: true },
  {
    id: "sexo",
    label: "Sexo biológico",
    type: "select",
    required: true,
    options: ["masculino", "femenino"],
  },
  {
    id: "nivel_actividad",
    label: "Nivel de actividad",
    type: "select",
    required: true,
    options: ["sedentario", "ligero", "moderado", "activo", "muy_activo"],
  },
]

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
}

function calcTmb(answers: IntakeAnswers): number | null {
  const peso = parseFloat(answers["peso_kg"] ?? "")
  const altura = parseFloat(answers["altura_cm"] ?? "")
  const edad = parseFloat(answers["edad"] ?? "")
  const sexo = answers["sexo"]?.toLowerCase().trim()
  if (isNaN(peso) || isNaN(altura) || isNaN(edad) || !sexo) return null
  // Mifflin-St Jeor
  const base = 10 * peso + 6.25 * altura - 5 * edad
  return sexo === "femenino" ? base - 161 : base + 5
}

function calcTdee(answers: IntakeAnswers): number | null {
  const tmb = calcTmb(answers)
  if (tmb === null) return null
  const factor =
    ACTIVITY_FACTORS[answers["nivel_actividad"]?.toLowerCase().trim() ?? ""] ?? null
  if (factor === null) return null
  return tmb * factor
}

const COMMAND_CALCULATORS: Record<string, (a: IntakeAnswers) => number | null> = {
  tmb: calcTmb,
  tdee: calcTdee,
}

/** Info de cada comando predefinido (para el panel de ayuda del coach). */
export const PREDEFINED_COMMANDS: Record<
  string,
  { label: string; description: string; fields: string[] }
> = {
  tmb: {
    label: "/tmb",
    description: "Tasa Metabólica Basal (Mifflin-St Jeor)",
    fields: ["peso_kg", "altura_cm", "edad", "sexo"],
  },
  tdee: {
    label: "/tdee",
    description: "Gasto Energético Total (TMB × nivel de actividad)",
    fields: ["peso_kg", "altura_cm", "edad", "sexo", "nivel_actividad"],
  },
}

/**
 * Evalúa el template de notas de nutrición reemplazando comandos y variables
 * con los valores del cliente.
 *
 * Sintaxis:
 *   /campo_id            → valor directo del intake answer
 *   /tmb                 → TMB (Mifflin-St Jeor)
 *   /tdee                → TDEE (TMB × factor de actividad)
 *   /comando op número   → resultado con operación (ej: /tdee - 500)
 *
 * Si faltan datos requeridos, muestra "[/comando: faltan datos]".
 */
export function evaluateNutritionTemplate(
  template: string,
  answers: IntakeAnswers
): string {
  return template.replace(
    /\/([a-z_]+)(\s*[+\-*/]\s*[\d.]+)?/g,
    (match, name: string, arithmetic?: string) => {
      let baseValue: number | null = null

      if (COMMAND_CALCULATORS[name]) {
        baseValue = COMMAND_CALCULATORS[name](answers)
        if (baseValue === null) {
          const needed = PREDEFINED_COMMANDS[name]?.fields.join(", ") ?? "datos necesarios"
          return `[/${name}: faltan ${needed}]`
        }
      } else if (name in answers) {
        const raw = answers[name]
        const parsed = parseFloat(raw)
        baseValue = isNaN(parsed) ? null : parsed
        if (baseValue === null) return raw
      } else {
        return match
      }

      if (arithmetic) {
        const trimmed = arithmetic.trim()
        const op = trimmed[0]
        const operand = parseFloat(trimmed.slice(1).trim())
        if (!isNaN(operand)) {
          if (op === "+") baseValue = baseValue + operand
          else if (op === "-") baseValue = baseValue - operand
          else if (op === "*") baseValue = baseValue * operand
          else if (op === "/") baseValue = operand !== 0 ? baseValue / operand : baseValue
        }
      }

      return Math.round(baseValue).toString()
    }
  )
}
