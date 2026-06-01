-- Preferencias de frases motivacionales por usuario.
-- categories: array de claves de categorías activas. Vacío = todas activas.

create table quote_preferences (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  enabled    boolean not null default true,
  categories text[]  not null default '{}',  -- vacío = todas las categorías
  updated_at timestamptz not null default now()
);

alter table quote_preferences enable row level security;
create policy "Owner full access on quote_preferences"
  on quote_preferences for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
