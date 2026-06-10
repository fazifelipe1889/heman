-- ============================================================================
-- 0028_custom_exercises.sql — Ejercicios custom por usuario / coach
-- ============================================================================
--
-- NOTA DE DISEÑO
-- --------------
-- Los ejercicios custom NO usan una tabla nueva. Reutilizan la tabla
-- `public.exercises` (migración 0010) distinguiendo por `created_by`:
--   · created_by IS NULL          → catálogo global (seed.sql, inmutable)
--   · created_by = <uuid usuario> → ejercicio custom propiedad de ese usuario
--                                    (o coach; es el mismo auth.users.id)
--
-- Esto permite que el ExercisePicker y `getExercises` los incluyan con el
-- mismo query, sin lógica de merge ni una segunda tabla. La RLS de 0010 ya
-- cubre select (global o propio), insert/update/delete (solo propios).
--
-- Esta migración es IDEMPOTENTE y DEFENSIVA: solo (re)crea las políticas
-- necesarias para custom exercises por si una base remota fue creada antes de
-- que 0010 incluyera insert/update/delete. Si la 0010 ya está aplicada por
-- completo, este script no cambia nada funcional.
--
-- Aplicar manualmente en el SQL Editor de Supabase si hace falta.
-- ============================================================================

alter table public.exercises enable row level security;

-- Lectura: catálogo global o ejercicios propios.
drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises
  for select using (created_by is null or created_by = auth.uid());

-- Inserción: solo ejercicios propios (created_by = uid del autenticado).
drop policy if exists "exercises_insert" on public.exercises;
create policy "exercises_insert" on public.exercises
  for insert with check (created_by = auth.uid());

-- Actualización: solo el propietario.
drop policy if exists "exercises_update" on public.exercises;
create policy "exercises_update" on public.exercises
  for update using (created_by = auth.uid());

-- Eliminación: solo el propietario (el catálogo global queda protegido porque
-- created_by IS NULL nunca iguala a auth.uid()).
drop policy if exists "exercises_delete" on public.exercises;
create policy "exercises_delete" on public.exercises
  for delete using (created_by = auth.uid());

-- Índice para listar rápido los ejercicios de un usuario.
create index if not exists exercises_created_by_idx
  on public.exercises (created_by);
