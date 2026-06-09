-- Tour de bienvenida (spotlight) del Inicio.
-- Marca cuándo el usuario completó/saltó el tour guiado del dashboard.
-- La policy de UPDATE de profiles por auth.uid() = id ya existe (0001_profiles.sql),
-- así que el usuario puede setear su propio flag sin policy adicional.

alter table public.profiles add column if not exists tour_completed_at timestamptz;
