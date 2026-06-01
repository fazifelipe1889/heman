-- =============================================================================
-- MIGRATION: 0016_coach_profiles_insert_policy
-- Descripción: Agrega la política RLS de INSERT que faltaba en coach_profiles.
--
-- Bug: 0011_coaching_core habilitó RLS en coach_profiles y definió políticas
-- de SELECT/UPDATE/DELETE, pero NO de INSERT. Con RLS activo y sin política de
-- INSERT, Postgres bloquea toda inserción → el alta de coach ("Enviar
-- solicitud" en /coach/apply) fallaba con "No se pudo crear el perfil de coach".
--
-- El usuario solo puede crear SU propia fila (auth.uid() = id). El estado queda
-- en 'pending_review' por el default de la columna; la moderación (admin) cambia
-- el status vía service_role.
-- =============================================================================

drop policy if exists "coach_profiles_insert_self" on coach_profiles;
create policy "coach_profiles_insert_self" on coach_profiles
  for insert with check (auth.uid() = id);
