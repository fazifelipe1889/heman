-- =============================================================================
-- MIGRATION: 0019_coaching_transformations
-- Descripción: Prueba social del coaching marketplace.
--              coaching_transformation = casos antes/después que el coach
--              muestra en la landing de su asesoría (foto antes/después,
--              métrica "+8kg en 24 semanas" y testimonio del cliente).
-- =============================================================================

create table if not exists coaching_transformation (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references coach_profiles(id) on delete cascade,
  -- opcional: si se setea, la transformación es específica de esa asesoría;
  -- si es null, es general del coach y se muestra en todas sus landings.
  program_id   uuid references coaching_program(id) on delete set null,
  client_name  text not null,             -- "Isidro" o iniciales
  before_url   text,                      -- foto "antes"
  after_url    text,                      -- foto "después"
  metric       text,                      -- "+15 kg de masa muscular · 48 semanas"
  testimonial  text,                      -- comentario del cliente
  position     int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_coaching_transformation_coach_id on coaching_transformation(coach_id);
create index idx_coaching_transformation_program_id on coaching_transformation(program_id);

-- =============================================================================
-- POLÍTICAS RLS
-- Lectura pública si el coach está activo; el dueño gestiona las suyas.
-- =============================================================================
alter table coaching_transformation enable row level security;

drop policy if exists "coaching_transformation_public_active" on coaching_transformation;
create policy "coaching_transformation_public_active" on coaching_transformation
  for select using (
    exists (select 1 from coach_profiles where id = coach_id and status = 'active')
    or auth.uid() = coach_id
  );

drop policy if exists "coaching_transformation_insert_coach" on coaching_transformation;
create policy "coaching_transformation_insert_coach" on coaching_transformation
  for insert with check (auth.uid() = coach_id);

drop policy if exists "coaching_transformation_update_coach" on coaching_transformation;
create policy "coaching_transformation_update_coach" on coaching_transformation
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "coaching_transformation_delete_coach" on coaching_transformation;
create policy "coaching_transformation_delete_coach" on coaching_transformation
  for delete using (auth.uid() = coach_id);

-- =============================================================================
-- TRIGGER: updated_at
-- =============================================================================
create or replace function update_coaching_transformation_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_coaching_transformation_updated_at_trigger on coaching_transformation;
create trigger update_coaching_transformation_updated_at_trigger
before update on coaching_transformation for each row
execute function update_coaching_transformation_updated_at();
