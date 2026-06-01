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
