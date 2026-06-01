-- ============================================================================
-- Módulo: Rutinas y Planificación
-- Separa por completo musculación / cardio (LISS y HIIT) y prepara el plan
-- semanal. Reemplaza el catálogo de ejercicios por placeholders en código.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Limpieza del catálogo de ejercicios (si se había creado en una migración previa)
-- ---------------------------------------------------------------------------
drop table if exists public.exercises cascade;
drop type if exists public.exercise_kind;
drop type if exists public.muscle_group;
drop type if exists public.equipment;
drop type if exists public.movement_type;
drop type if exists public.difficulty;

-- ---------------------------------------------------------------------------
-- Enum discriminador del tipo de rutina
-- ---------------------------------------------------------------------------
create type public.routine_type as enum ('musculacion', 'cardio_liss', 'cardio_hiit');

-- ---------------------------------------------------------------------------
-- Rutinas (cabecera común a todos los tipos)
-- ---------------------------------------------------------------------------
create table public.routines (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  type              public.routine_type not null,
  name              text not null,
  description       text,
  goal              public.goal,
  experience_level  public.experience_level,
  days_per_week     smallint check (days_per_week is null or days_per_week between 1 and 7),
  split             text,
  is_favorite       boolean not null default false,
  is_archived       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index routines_user_idx on public.routines (user_id);
create index routines_type_idx on public.routines (type);

-- Días de una rutina de musculación (Push, Pull, Legs, ...)
create table public.routine_days (
  id                    uuid primary key default gen_random_uuid(),
  routine_id            uuid not null references public.routines (id) on delete cascade,
  position              smallint not null default 0,
  name                  text not null,
  primary_muscle_group  text
);
create index routine_days_routine_idx on public.routine_days (routine_id);

-- Ejercicios dentro de un día (placeholder por nombre; exercise_ref para futura FK)
create table public.routine_day_exercises (
  id              uuid primary key default gen_random_uuid(),
  day_id          uuid not null references public.routine_days (id) on delete cascade,
  position        smallint not null default 0,
  exercise_name   text not null,
  exercise_ref    text,
  sets            smallint not null default 3,
  target_reps     text,
  target_weight   numeric(6, 2),
  target_rir      numeric(3, 1),
  rest_seconds    integer,
  notes           text
);
create index routine_day_exercises_day_idx on public.routine_day_exercises (day_id);

-- Configuración cardio LISS (1:1 con la rutina)
create table public.routine_liss (
  routine_id        uuid primary key references public.routines (id) on delete cascade,
  modality          text,
  duration_min      integer,
  intensity         text,
  incline           numeric(4, 1),
  speed             numeric(4, 1),
  distance_km       numeric(5, 2),
  target_calories   integer,
  weekly_frequency  smallint
);

-- Configuración cardio HIIT (1:1 con la rutina)
create table public.routine_hiit (
  routine_id     uuid primary key references public.routines (id) on delete cascade,
  main_exercise  text,
  rounds         smallint,
  work_seconds   integer,
  rest_seconds   integer,
  intervals      smallint,
  intensity      text
);

-- ---------------------------------------------------------------------------
-- Planificación semanal
-- ---------------------------------------------------------------------------
create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index plans_user_idx on public.plans (user_id);

create table public.plan_days (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.plans (id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6),
  routine_id   uuid references public.routines (id) on delete set null,
  position     smallint not null default 0
);
create index plan_days_plan_idx on public.plan_days (plan_id);

-- ---------------------------------------------------------------------------
-- Triggers updated_at (la función handle_updated_at ya existe desde 0001)
-- ---------------------------------------------------------------------------
create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.handle_updated_at();

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_day_exercises enable row level security;
alter table public.routine_liss enable row level security;
alter table public.routine_hiit enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;

-- routines: dueño directo
create policy "routines_all_own" on public.routines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- helper de propiedad vía rutina padre
create policy "routine_days_all_own" on public.routine_days
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

create policy "routine_liss_all_own" on public.routine_liss
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

create policy "routine_hiit_all_own" on public.routine_hiit
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

-- ejercicios del día: propiedad vía día -> rutina
create policy "routine_day_exercises_all_own" on public.routine_day_exercises
  for all to authenticated
  using (exists (
    select 1 from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = day_id and r.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = day_id and r.user_id = (select auth.uid())
  ));

create policy "plans_all_own" on public.plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "plan_days_all_own" on public.plan_days
  for all to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid())));
