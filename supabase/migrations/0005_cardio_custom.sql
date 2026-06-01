-- ============================================================
-- 0005 — Tipo de cardio: Intervalos personalizados
--
-- Agrega `cardio_custom` como tercer subtipo de cardio.
-- Una rutina de tipo cardio_custom tiene:
--   · routine_custom_config: rondas globales y notas
--   · routine_interval_blocks: bloques secuenciales con duración e intensidad
-- ============================================================

-- 1. Nuevo valor en el enum (no puede estar dentro de una transacción)
alter type public.routine_type add value if not exists 'cardio_custom';

-- 2. Config global de la rutina de intervalos (1:1 con routines)
create table public.routine_custom_config (
  routine_id  uuid primary key references public.routines(id) on delete cascade,
  rounds      int  not null default 1,
  notes       text
);

alter table public.routine_custom_config enable row level security;

create policy "users manage own custom config"
  on public.routine_custom_config
  for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_custom_config.routine_id
        and r.user_id = (select auth.uid())
    )
  );

-- 3. Bloques de la rutina de intervalos (1:N con routines)
create table public.routine_interval_blocks (
  id               uuid        primary key default gen_random_uuid(),
  routine_id       uuid        not null references public.routines(id) on delete cascade,
  position         int         not null default 0,
  name             text        not null default 'Bloque',
  duration_seconds int         not null default 30,
  intensity        text,
  created_at       timestamptz not null default now()
);

alter table public.routine_interval_blocks enable row level security;

create policy "users manage own interval blocks"
  on public.routine_interval_blocks
  for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_interval_blocks.routine_id
        and r.user_id = (select auth.uid())
    )
  );
