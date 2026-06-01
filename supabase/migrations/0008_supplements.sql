-- Módulo de suplementación: lista personalizada + registro diario.

create table supplements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  dose           text not null default '',        -- "5 g", "1 cápsula", etc.
  notes          text not null default '',
  days_of_week   int[] not null default '{0,1,2,3,4,5,6}', -- 0=Lun … 6=Dom
  times_of_day   text[] not null default '{}',   -- ["mañana","noche"], meramente informativo
  color          text not null default 'blue',   -- clave de color predefinida
  is_active      boolean not null default true,
  position       int not null default 0,          -- orden en la lista
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table supplements enable row level security;
create policy "Owner full access on supplements"
  on supplements for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index supplements_user_idx on supplements(user_id, is_active, position);

-- Un registro por suplemento por día. Presencia = tomado, ausencia = no tomado.
create table supplement_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  supplement_id  uuid not null references supplements(id) on delete cascade,
  log_date       date not null,
  created_at     timestamptz not null default now(),
  constraint supplement_logs_unique unique (user_id, supplement_id, log_date)
);

alter table supplement_logs enable row level security;
create policy "Owner full access on supplement_logs"
  on supplement_logs for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index supplement_logs_user_date_idx on supplement_logs(user_id, log_date);
create index supplement_logs_supplement_idx on supplement_logs(supplement_id, log_date);
