// Sincroniza el catálogo global de ejercicios con la DB remota de Supabase.
// Reemplaza TODOS los ejercicios globales (created_by IS NULL) por los de
// scripts/exercises_data.json. Preserva los ejercicios creados por usuarios.
//
// Uso:  node scripts/sync_exercises.mjs
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv(path) {
  const out = {}
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

const env = loadEnv(new URL("../.env.local", import.meta.url))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const records = JSON.parse(
  readFileSync(new URL("./exercises_data.json", import.meta.url), "utf8"),
)
if (!Array.isArray(records) || records.length === 0) {
  console.error("exercises_data.json vacío o inválido — abortando")
  process.exit(1)
}
console.log(`Cargados ${records.length} ejercicios desde JSON`)

// 1. Conteos previos
const { count: before } = await supabase
  .from("exercises")
  .select("*", { count: "exact", head: true })
  .is("created_by", null)
console.log(`Globales actuales: ${before}`)

// 2. Borrar globales existentes
const { error: delErr } = await supabase.from("exercises").delete().is("created_by", null)
if (delErr) {
  console.error("ERROR al borrar:", delErr.message)
  process.exit(1)
}
console.log("Globales borrados")

// 3. Insertar nuevos en lotes
const BATCH = 100
let inserted = 0
for (let i = 0; i < records.length; i += BATCH) {
  const chunk = records.slice(i, i + BATCH).map((r) => ({
    name: r.name,
    primary_muscle_group: r.primary_muscle_group,
    secondary_muscle_groups: r.secondary_muscle_groups ?? [],
    equipment: r.equipment,
    movement_type: r.movement_type,
    difficulty: r.difficulty,
    instructions: r.instructions ?? "",
    image_url: r.image_url ?? null,
  }))
  const { error: insErr } = await supabase.from("exercises").insert(chunk)
  if (insErr) {
    console.error(`ERROR insertando lote ${i / BATCH + 1}:`, insErr.message)
    process.exit(1)
  }
  inserted += chunk.length
  console.log(`  insertados ${inserted}/${records.length}`)
}

// 4. Verificación final
const { count: after } = await supabase
  .from("exercises")
  .select("*", { count: "exact", head: true })
  .is("created_by", null)
const { count: withImg } = await supabase
  .from("exercises")
  .select("*", { count: "exact", head: true })
  .is("created_by", null)
  .not("image_url", "is", null)
console.log(`✓ Globales tras sync: ${after}  (con imagen: ${withImg})`)
