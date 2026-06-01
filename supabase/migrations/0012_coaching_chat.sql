-- =============================================================================
-- MIGRATION: 0012_coaching_chat
-- Descripción: Tablas de chat entre coach y usuario
--              - coaching_thread (un thread por suscripción)
--              - coaching_message (mensajes individuales)
-- =============================================================================

-- =============================================================================
-- TABLA: coaching_thread
-- Un thread = una suscripción = un canal de comunicación coach <> usuario
-- =============================================================================
create table if not exists coaching_thread (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null unique references coaching_subscription(id) on delete cascade,
  coach_id         uuid not null references coach_profiles(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  last_message_at  timestamptz,
  coach_unread     int default 0,
  user_unread      int default 0,
  created_at       timestamptz default now()
);

create index idx_coaching_thread_coach_id on coaching_thread(coach_id);
create index idx_coaching_thread_user_id on coaching_thread(user_id);
create index idx_coaching_thread_last_message_at on coaching_thread(last_message_at);

-- =============================================================================
-- TABLA: coaching_message
-- Mensaje individual en un thread
-- =============================================================================
create table if not exists coaching_message (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references coaching_subscription(id) on delete cascade,
  sender_id        uuid not null references auth.users(id) on delete cascade,
  sender_role      text not null check (sender_role in ('coach', 'user')),
  body             text,
  attachment_url   text,
  attachment_type  text check (attachment_type in ('image', 'video', 'file')),
  read_at          timestamptz,
  created_at       timestamptz default now()
);

create index idx_coaching_message_subscription_id on coaching_message(subscription_id);
create index idx_coaching_message_sender_id on coaching_message(sender_id);
create index idx_coaching_message_created_at on coaching_message(subscription_id, created_at);

-- =============================================================================
-- POLÍTICAS RLS
-- =============================================================================

-- coaching_thread: usuario ve sus threads + coach ve sus threads
alter table coaching_thread enable row level security;

drop policy if exists "coaching_thread_user_coach" on coaching_thread;
create policy "coaching_thread_user_coach" on coaching_thread
  for select using (
    auth.uid() = user_id or auth.uid() = coach_id
  );

drop policy if exists "coaching_thread_update_counters" on coaching_thread;
create policy "coaching_thread_update_counters" on coaching_thread
  for update using (
    auth.uid() = user_id or auth.uid() = coach_id
  ) with check (
    auth.uid() = user_id or auth.uid() = coach_id
  );

-- coaching_message: gateado por suscripción activa + thread debe estar abierto
alter table coaching_message enable row level security;

drop policy if exists "coaching_message_read_write" on coaching_message;
create policy "coaching_message_read_write" on coaching_message
  for all using (
    exists (
      select 1 from coaching_subscription s
      where s.id = subscription_id
        and s.status = 'active'
        and (s.user_id = auth.uid() or s.coach_id = auth.uid())
        and exists (
          select 1 from coaching_plan p
          where p.id = s.plan_id
            and (p.perks->'chat'->>'enabled')::boolean = true
        )
    )
  );

-- =============================================================================
-- TRIGGERS / FUNCIONES
-- =============================================================================

-- Función: al insertar mensaje, actualizar thread (last_message_at, contadores)
create or replace function handle_coaching_message_insert()
returns trigger as $$
declare
  v_thread_id uuid;
begin
  -- Obtener thread_id desde subscription_id
  select id into v_thread_id from coaching_thread
  where subscription_id = new.subscription_id
  limit 1;

  if v_thread_id is not null then
    update coaching_thread
    set
      last_message_at = new.created_at,
      coach_unread = case when new.sender_role = 'user' then coach_unread + 1 else coach_unread end,
      user_unread = case when new.sender_role = 'coach' then user_unread + 1 else user_unread end
    where id = v_thread_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_coaching_message_insert_trigger on coaching_message;
create trigger handle_coaching_message_insert_trigger
after insert on coaching_message for each row
execute function handle_coaching_message_insert();

-- Función: marcar mensaje como leído
create or replace function mark_coaching_message_read(message_id uuid)
returns void as $$
declare
  v_sender_role text;
  v_subscription_id uuid;
begin
  select sender_role, subscription_id into v_sender_role, v_subscription_id
  from coaching_message
  where id = message_id;

  update coaching_message
  set read_at = now()
  where id = message_id and read_at is null;

  if found and v_subscription_id is not null then
    -- Actualizar contadores en thread
    if v_sender_role = 'coach' then
      update coaching_thread
      set user_unread = greatest(0, user_unread - 1)
      where subscription_id = v_subscription_id;
    else
      update coaching_thread
      set coach_unread = greatest(0, coach_unread - 1)
      where subscription_id = v_subscription_id;
    end if;
  end if;
end;
$$ language plpgsql;
