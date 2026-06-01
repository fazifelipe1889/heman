"""Genera supabase/migrations/0010_exercises.sql y supabase/seed.sql"""

import re, os, sys

# ── Leer los ejercicios del script existente ──────────────────────────────────
with open("create_exercises.py", encoding="utf-8") as f:
    src = f.read()

# Extraer el array de ejercicios entre `exercises = [` y el primer `]` al nivel 0
m = re.search(r'exercises\s*=\s*\[(.*?)\n\]', src, re.DOTALL)
if not m:
    sys.exit("No se encontró el array exercises")

raw = m.group(1)

# Parsear cada línea de ejercicio
exercises = []
for line in raw.splitlines():
    line = line.strip()
    if not line.startswith("["):
        continue
    # Quitar [ y ]
    inner = line.lstrip("[").rstrip("],").rstrip("]")
    # Split por comas que NO están dentro de comillas
    parts = []
    current = ""
    in_quote = False
    for ch in inner:
        if ch == '"' and not in_quote:
            in_quote = True
        elif ch == '"' and in_quote:
            in_quote = False
        elif ch == ',' and not in_quote:
            parts.append(current.strip().strip('"'))
            current = ""
            continue
        else:
            pass
        current += ch
    if current.strip():
        parts.append(current.strip().strip('"'))
    if len(parts) >= 7:
        exercises.append(parts)

print(f"Ejercicios encontrados: {len(exercises)}")

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Helpers SQL ───────────────────────────────────────────────────────────────
def esc(s):
    """Escapa comillas simples para SQL."""
    return s.replace("'", "''")

def arr(s):
    """Convierte 'A, B, C' en ARRAY['A','B','C']."""
    if not s.strip():
        return "ARRAY[]::text[]"
    items = [f"'{esc(x.strip())}'" for x in s.split(",")]
    return "ARRAY[" + ", ".join(items) + "]"

# ── Migration 0010 ────────────────────────────────────────────────────────────
migration = """\
-- ============================================================================
-- 0010_exercises.sql — Catálogo global de ejercicios
-- ============================================================================

-- Tipos de dificultad
create type if not exists public.exercise_difficulty as enum (
  'Principiante',
  'Intermedio',
  'Avanzado'
);

-- Tabla principal
create table if not exists public.exercises (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  primary_muscle_group   text        not null,
  secondary_muscle_groups text[]     not null default '{}',
  equipment              text        not null,
  movement_type          text        not null,
  difficulty             public.exercise_difficulty not null,
  instructions           text        not null default '',
  video_url              text,
  image_url              text,
  tags                   text[]      not null default '{}',
  created_by             uuid        references auth.users (id) on delete cascade,
  parent_exercise_id     uuid        references public.exercises (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Índices útiles para filtros
create index if not exists exercises_primary_muscle_idx  on public.exercises (primary_muscle_group);
create index if not exists exercises_equipment_idx       on public.exercises (equipment);
create index if not exists exercises_difficulty_idx      on public.exercises (difficulty);
create index if not exists exercises_created_by_idx      on public.exercises (created_by);

-- RLS
alter table public.exercises enable row level security;

-- Lectura: ejercicios globales (created_by IS NULL) o propios
create policy "exercises_select" on public.exercises
  for select using (created_by is null or created_by = auth.uid());

-- Inserción solo del propio usuario
create policy "exercises_insert" on public.exercises
  for insert with check (created_by = auth.uid());

-- Actualización solo del propietario
create policy "exercises_update" on public.exercises
  for update using (created_by = auth.uid());

-- Eliminación solo del propietario
create policy "exercises_delete" on public.exercises
  for delete using (created_by = auth.uid());

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exercises_updated_at
  before update on public.exercises
  for each row execute procedure public.set_updated_at();
"""

os.makedirs("supabase/migrations", exist_ok=True)
with open("supabase/migrations/0010_exercises.sql", "w", encoding="utf-8") as f:
    f.write(migration)
print("✓ supabase/migrations/0010_exercises.sql")

# ── Seed ──────────────────────────────────────────────────────────────────────
lines = [
    "-- seed.sql — Catálogo de ejercicios globales (created_by IS NULL)",
    "-- Generado automáticamente por generate_seed.py",
    "",
    "insert into public.exercises",
    "  (name, primary_muscle_group, secondary_muscle_groups, equipment, movement_type, difficulty, instructions)",
    "values",
]

rows = []
for ex in exercises:
    name      = esc(ex[0])
    primary   = esc(ex[1])
    secondary = arr(ex[2])
    equipment = esc(ex[3])
    movement  = esc(ex[4])
    diff      = esc(ex[5])
    instr     = esc(ex[6]) if len(ex) > 6 else ""
    rows.append(
        f"  ('{name}', '{primary}', {secondary}, '{equipment}', '{movement}', '{diff}', '{instr}')"
    )

lines.append(",\n".join(rows) + ";")

with open("supabase/seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"✓ supabase/seed.sql ({len(exercises)} ejercicios)")
