-- ============================================================================
-- Módulo: Entrenar — Sesiones de entrenamiento (historial de ejecución)
-- Guarda lo realmente ejecutado: series, reps, peso, RIR, volumen, duración.
-- Base para el HUD de ejecución y para el módulo de Progreso.
-- ============================================================================

create type public.session_status as enum ('active', 'completed', 'abandoned');

-- Cabecera de la sesión (musculación o cardio)
create table public.workout_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  routine_id        uuid references public.routines (id) on delete set null,
  type              public.routine_type not null,
  name              text not null,                 -- snapshot del nombre de la rutina
  day_name          text,                          -- día ejecutado (musculación)
  status            public.session_status not null default 'active',
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_seconds  integer,
  total_volume      numeric(10, 2),                -- cache: Σ reps×peso (musculación)
  notes             text,
  created_at        timestamptz not null default now()
);
create index workout_sessions_user_idx on public.workout_sessions (user_id);
create index workout_sessions_status_idx on public.workout_sessions (status);
create index workout_sessions_started_idx on public.workout_sessions (started_at desc);

-- Ejercicios de la sesión (musculación)
create table public.session_exercises (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.workout_sessions (id) on delete cascade,
  position       smallint not null default 0,
  exercise_name  text not null,
  exercise_ref   text
);
create index session_exercises_session_idx on public.session_exercises (session_id);

-- Series reales por ejercicio
create table public.session_sets (
  id                   uuid primary key default gen_random_uuid(),
  session_exercise_id  uuid not null references public.session_exercises (id) on delete cascade,
  set_index            smallint not null,
  target_reps          text,
  target_weight        numeric(6, 2),
  target_rir           numeric(3, 1),
  actual_reps          smallint,
  actual_weight        numeric(6, 2),
  actual_rir           numeric(3, 1),
  completed            boolean not null default false
);
create index session_sets_exercise_idx on public.session_sets (session_exercise_id);

-- Datos de sesión de cardio (1:1)
create table public.session_cardio (
  session_id           uuid primary key references public.workout_sessions (id) on delete cascade,
  duration_seconds     integer,
  rounds_completed     smallint,
  intervals_completed  smallint,
  calories             integer,
  distance_km          numeric(5, 2)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_sets enable row level security;
alter table public.session_cardio enable row level security;

create policy "workout_sessions_all_own" on public.workout_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "session_exercises_all_own" on public.session_exercises
  for all to authenticated
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = (select auth.uid())
  ));

create policy "session_sets_all_own" on public.session_sets
  for all to authenticated
  using (exists (
    select 1 from public.session_exercises e
    join public.workout_sessions s on s.id = e.session_id
    where e.id = session_exercise_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.session_exercises e
    join public.workout_sessions s on s.id = e.session_id
    where e.id = session_exercise_id and s.user_id = (select auth.uid())
  ));

create policy "session_cardio_all_own" on public.session_cardio
  for all to authenticated
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = (select auth.uid())
  ));
