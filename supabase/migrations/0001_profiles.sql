-- ============================================================================
-- Fase 1 — Perfiles de usuario
-- Tabla `profiles` (1:1 con auth.users), enums, RLS y triggers.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos enum del dominio
-- ---------------------------------------------------------------------------
create type public.sex as enum ('male', 'female', 'other');
create type public.goal as enum (
  'fat_loss', 'hypertrophy', 'strength', 'endurance', 'general'
);
create type public.experience_level as enum (
  'beginner', 'intermediate', 'advanced'
);
create type public.units as enum ('metric', 'imperial');
create type public.training_type as enum ('musculacion', 'hiit', 'cardio');

-- ---------------------------------------------------------------------------
-- Tabla profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  full_name                text,
  birth_date               date,
  sex                      public.sex,
  height_cm                numeric(5, 1) check (height_cm is null or height_cm between 50 and 260),
  weight_kg                numeric(5, 1) check (weight_kg is null or weight_kg between 20 and 400),
  goal                     public.goal,
  experience_level         public.experience_level,
  training_days_per_week   smallint check (training_days_per_week is null or training_days_per_week between 0 and 7),
  preferred_training_type  public.training_type,
  units                    public.units not null default 'metric',
  onboarding_completed     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.profiles is 'Datos personales y físicos del usuario (1:1 con auth.users).';

-- ---------------------------------------------------------------------------
-- Row Level Security: cada usuario solo accede a su propio perfil
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Trigger: mantener updated_at
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: crear fila en profiles automáticamente al registrarse un usuario
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
