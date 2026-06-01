-- =============================================================================
-- MIGRATION: 0011_coaching_core
-- Descripción: Tablas core del sistema de asesorías (coaching marketplace)
--              - coach_profiles (identidad del coach)
--              - coaching_program (asesoría/oferta)
--              - coaching_plan (producto comprable)
--              - coaching_routine_template (plantilla de rutina)
--              - coaching_supplement_template (plantilla de suplementos)
--              - coaching_subscription (suscripción activa del usuario)
-- =============================================================================

-- Primero, agregar columna 'role' a profiles si no existe
alter table profiles add column if not exists role text default 'user' check (role in ('user', 'coach', 'admin'));
create index if not exists idx_profiles_role on profiles(role);

-- =============================================================================
-- TABLA: coach_profiles
-- Identidad comercial pública del coach
-- =============================================================================
create table if not exists coach_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  handle          text unique not null,
  display_name    text not null,
  headline        text,
  bio             text,
  avatar_url      text,
  cover_url       text,
  socials         jsonb default '{}',
  is_verified     boolean default false,
  status          text default 'pending_review' check (status in ('pending_review', 'active', 'suspended', 'rejected')),
  commission_pct  numeric default 15,
  payout_provider text,
  payout_ref      jsonb default '{}',
  rating_avg      numeric default 0,
  rating_count    int default 0,
  active_clients  int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_coach_profiles_handle on coach_profiles(handle);
create index idx_coach_profiles_status on coach_profiles(status);

-- =============================================================================
-- TABLA: coaching_program
-- La asesoría / landing del coach
-- =============================================================================
create table if not exists coaching_program (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references coach_profiles(id) on delete cascade,
  slug             text not null,
  title            text not null,
  tagline          text,
  description      text,
  category         text not null check (category in ('musculacion', 'recomposicion', 'fuerza', 'perdida_grasa', 'cardio', 'mixto')),
  cover_url        text,
  intro_video_url  text,
  level            text check (level in ('Principiante', 'Intermedio', 'Avanzado')),
  includes         jsonb default '{}',
  faq              jsonb default '[]',
  status           text default 'draft' check (status in ('draft', 'published', 'archived')),
  position         int default 0,
  published_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (coach_id, slug)
);

create index idx_coaching_program_coach_id on coaching_program(coach_id);
create index idx_coaching_program_status on coaching_program(status);
create index idx_coaching_program_category on coaching_program(category);

-- =============================================================================
-- TABLA: coach_routine_template
-- Plantilla de rutina que el coach reutiliza (snapshot inmutable al comprar)
-- DEBE CREARSE ANTES de coaching_plan (que la referencia)
-- =============================================================================
create table if not exists coach_routine_template (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coach_profiles(id) on delete cascade,
  name        text not null,
  description text,
  payload     jsonb not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_coach_routine_template_coach_id on coach_routine_template(coach_id);

-- =============================================================================
-- TABLA: coach_supplement_template
-- Plantilla de suplementación que el coach reutiliza
-- DEBE CREARSE ANTES de coaching_plan (que la referencia)
-- =============================================================================
create table if not exists coach_supplement_template (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coach_profiles(id) on delete cascade,
  name        text not null,
  description text,
  items       jsonb not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_coach_supplement_template_coach_id on coach_supplement_template(coach_id);

-- =============================================================================
-- TABLA: coaching_plan
-- El producto comprable (tier: Base, Premium, VIP, etc)
-- =============================================================================
create table if not exists coaching_plan (
  id                     uuid primary key default gen_random_uuid(),
  program_id             uuid not null references coaching_program(id) on delete cascade,
  coach_id               uuid not null references coach_profiles(id),
  name                   text not null,
  description            text,
  price_cents            int not null,
  currency               text default 'ARS',
  billing_type           text default 'one_time' check (billing_type in ('one_time', 'recurring')),
  recurring_interval     text check (recurring_interval in ('month', 'quarter', 'year')),
  duration_days          int not null,
  perks                  jsonb not null default '{"chat":{"enabled":false},"video_calls":{"count":0,"minutes":0},"routine":{"enabled":false,"reconfigs_included":0},"supplements":{"enabled":false},"progress_sharing":{"enabled":false}}',
  routine_template_id    uuid references coach_routine_template(id),
  supplement_template_id uuid references coach_supplement_template(id),
  is_visible             boolean default true,
  position               int default 0,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index idx_coaching_plan_program_id on coaching_plan(program_id);
create index idx_coaching_plan_coach_id on coaching_plan(coach_id);
create index idx_coaching_plan_visible on coaching_plan(is_visible) where is_visible = true;

-- =============================================================================
-- TABLA: coaching_subscription
-- El corazón: vínculo entre usuario y plan comprado
-- =============================================================================
create table if not exists coaching_subscription (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan_id             uuid not null references coaching_plan(id),
  program_id          uuid not null references coaching_program(id),
  coach_id            uuid not null references coach_profiles(id),
  status              text not null default 'pending' check (status in ('pending', 'active', 'paused', 'expired', 'cancelled', 'refunded')),
  starts_at           timestamptz,
  ends_at             timestamptz,
  perks_snapshot      jsonb not null,
  routine_id          uuid references routines(id),
  messages_used       int default 0,
  video_calls_used    int default 0,
  reconfigs_used      int default 0,
  coach_notes         text,
  last_payment_id     uuid,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_coaching_subscription_coach_id on coaching_subscription(coach_id);
create index idx_coaching_subscription_user_id on coaching_subscription(user_id);
create index idx_coaching_subscription_status on coaching_subscription(status);
create index idx_coaching_subscription_ends_at on coaching_subscription(ends_at) where status = 'active';
create unique index idx_coaching_subscription_active_per_user on coaching_subscription(user_id, plan_id) where status = 'active';

-- =============================================================================
-- POLÍTICAS RLS
-- =============================================================================

-- coach_profiles: lectura pública si status='active', todas para dueño
alter table coach_profiles enable row level security;

drop policy if exists "coach_profiles_public_active" on coach_profiles;
create policy "coach_profiles_public_active" on coach_profiles
  for select using (status = 'active' or auth.uid() = id);

drop policy if exists "coach_profiles_update_self" on coach_profiles;
create policy "coach_profiles_update_self" on coach_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "coach_profiles_delete_self" on coach_profiles;
create policy "coach_profiles_delete_self" on coach_profiles
  for delete using (auth.uid() = id);

-- coaching_program: lectura pública si published, todas para dueño
alter table coaching_program enable row level security;

drop policy if exists "coaching_program_public_published" on coaching_program;
create policy "coaching_program_public_published" on coaching_program
  for select using (status = 'published' or auth.uid() = coach_id);

drop policy if exists "coaching_program_insert_coach" on coaching_program;
create policy "coaching_program_insert_coach" on coaching_program
  for insert with check (
    auth.uid() = coach_id and
    exists (select 1 from coach_profiles where id = auth.uid() and status = 'active')
  );

drop policy if exists "coaching_program_update_coach" on coaching_program;
create policy "coaching_program_update_coach" on coaching_program
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "coaching_program_delete_coach" on coaching_program;
create policy "coaching_program_delete_coach" on coaching_program
  for delete using (auth.uid() = coach_id);

-- coaching_plan: lectura pública si programa published, todas para dueño
alter table coaching_plan enable row level security;

drop policy if exists "coaching_plan_public_published" on coaching_plan;
create policy "coaching_plan_public_published" on coaching_plan
  for select using (
    is_visible and exists (
      select 1 from coaching_program where id = program_id and status = 'published'
    ) or auth.uid() = coach_id
  );

drop policy if exists "coaching_plan_insert_coach" on coaching_plan;
create policy "coaching_plan_insert_coach" on coaching_plan
  for insert with check (auth.uid() = coach_id);

drop policy if exists "coaching_plan_update_coach" on coaching_plan;
create policy "coaching_plan_update_coach" on coaching_plan
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- coach_routine_template: solo para el coach dueño
alter table coach_routine_template enable row level security;

drop policy if exists "coach_routine_template_self" on coach_routine_template;
create policy "coach_routine_template_self" on coach_routine_template
  for all using (auth.uid() = coach_id);

-- coach_supplement_template: solo para el coach dueño
alter table coach_supplement_template enable row level security;

drop policy if exists "coach_supplement_template_self" on coach_supplement_template;
create policy "coach_supplement_template_self" on coach_supplement_template
  for all using (auth.uid() = coach_id);

-- coaching_subscription: usuario ve lo suyo + coach ve sus clientes
alter table coaching_subscription enable row level security;

drop policy if exists "coaching_subscription_user_coach" on coaching_subscription;
create policy "coaching_subscription_user_coach" on coaching_subscription
  for select using (
    auth.uid() = user_id or auth.uid() = coach_id
  );

drop policy if exists "coaching_subscription_user_chat" on coaching_subscription;
create policy "coaching_subscription_user_chat" on coaching_subscription
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS / FUNCIONES AUXILIARES
-- =============================================================================

-- Trigger: actualizar updated_at en coach_profiles
create or replace function update_coach_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_coach_profiles_updated_at_trigger on coach_profiles;
create trigger update_coach_profiles_updated_at_trigger
before update on coach_profiles for each row
execute function update_coach_profiles_updated_at();

-- Trigger: actualizar updated_at en coaching_program
create or replace function update_coaching_program_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_coaching_program_updated_at_trigger on coaching_program;
create trigger update_coaching_program_updated_at_trigger
before update on coaching_program for each row
execute function update_coaching_program_updated_at();

-- Trigger: actualizar updated_at en coaching_plan
create or replace function update_coaching_plan_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_coaching_plan_updated_at_trigger on coaching_plan;
create trigger update_coaching_plan_updated_at_trigger
before update on coaching_plan for each row
execute function update_coaching_plan_updated_at();

-- Trigger: actualizar updated_at en coaching_subscription
create or replace function update_coaching_subscription_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_coaching_subscription_updated_at_trigger on coaching_subscription;
create trigger update_coaching_subscription_updated_at_trigger
before update on coaching_subscription for each row
execute function update_coaching_subscription_updated_at();
