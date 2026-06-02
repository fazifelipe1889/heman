-- =============================================================================
-- MIGRATION: 0025_routine_template_subscriber_rls
-- Descripción: Permite a los suscriptores leer el template de rutina del
--   programa que compraron. Sin esto, el cliente no puede ver el tipo de
--   rutina (personalizada/adaptativa) para su suscripción activa.
-- =============================================================================

drop policy if exists "crt_subscriber_select" on coach_routine_template;
create policy "crt_subscriber_select" on coach_routine_template
  for select using (
    -- El coach dueño ya tiene acceso total via la policy existente.
    -- Esta agrega lectura para cualquier suscriptor del programa relacionado.
    exists (
      select 1
      from coaching_subscription s
      join coaching_plan p on p.id = s.plan_id
      where p.routine_template_id = coach_routine_template.id
        and s.user_id = auth.uid()
    )
  );
