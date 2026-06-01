-- ============================================================
-- 0004 — Reestructura de rutinas
--
-- ANTES: routine → routine_days → routine_day_exercises
--   Una "rutina" era un programa completo (ej. PPL con 3 días)
--
-- AHORA: routine → routine_exercises (lista plana)
--   Una "rutina" ES una sesión (ej. "Push Day" con sus ejercicios)
--   La planificación semanal (plan_days) asigna rutinas a días
-- ============================================================

-- 1. Borrar las tablas del modelo anterior
drop table if exists public.routine_day_exercises cascade;
drop table if exists public.routine_days cascade;

-- 2. Limpiar columnas de "routines" que ya no aplican a una sesión
alter table public.routines drop column if exists split;
alter table public.routines drop column if exists days_per_week;

-- 3. Crear routine_exercises (ejercicios directamente en la rutina)
create table public.routine_exercises (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routines(id) on delete cascade,
  position     int  not null default 0,
  exercise_name text not null,
  exercise_ref  text,
  sets          int  not null default 3,
  target_reps   text,
  target_weight numeric(8, 2),
  target_rir    int,
  rest_seconds  int  default 90,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table public.routine_exercises enable row level security;

-- RLS: sólo el dueño de la rutina puede ver/modificar sus ejercicios
create policy "users manage own routine exercises"
  on public.routine_exercises
  for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = (select auth.uid())
    )
  );
