-- =============================================================================
-- MIGRATION: 0024_coaching_content
-- Descripción: Contenido entregable del producto + formulario al cliente.
--   El contenido (texto/nutrición + definición del formulario) NO debe ser
--   público: vive en una tabla aparte con RLS para el dueño (coach) y los
--   suscriptores que compraron el producto. Las RESPUESTAS del formulario se
--   guardan en la suscripción (el cliente las actualiza vía RLS existente).
-- =============================================================================

create table if not exists coaching_program_content (
  program_id      uuid primary key references coaching_program(id) on delete cascade,
  coach_id        uuid not null references coach_profiles(id) on delete cascade,
  content         jsonb not null default '[]'::jsonb,  -- bloques entregables
  intake_form     jsonb not null default '[]'::jsonb,  -- definición del formulario
  nutrition_notes text,                                -- nutrición/planificación libre
  updated_at      timestamptz not null default now()
);

create index if not exists idx_coaching_program_content_coach
  on coaching_program_content(coach_id);

alter table coaching_program_content enable row level security;

-- Dueño (coach): acceso total a su propio contenido.
drop policy if exists "cpc_owner_all" on coaching_program_content;
create policy "cpc_owner_all" on coaching_program_content
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- Suscriptores: pueden LEER el contenido del producto que compraron.
drop policy if exists "cpc_subscriber_select" on coaching_program_content;
create policy "cpc_subscriber_select" on coaching_program_content
  for select using (
    exists (
      select 1 from coaching_subscription s
      where s.program_id = coaching_program_content.program_id
        and s.user_id = auth.uid()
    )
  );

-- Respuestas del formulario del cliente (el cliente actualiza su suscripción).
alter table coaching_subscription
  add column if not exists intake_answers jsonb;
