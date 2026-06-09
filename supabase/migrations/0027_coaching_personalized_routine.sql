-- Agrega soporte para rutinas personalizadas por cliente.
-- personalized_template_id: referencia al template de rutina que el coach
--   crea individualmente para cada suscriptor con modo "personalized".

alter table coaching_subscription
  add column if not exists personalized_template_id uuid
    references coach_routine_template(id) on delete set null;

-- Permite al suscriptor leer SU template personalizado.
drop policy if exists "crt_personalized_subscriber_select" on coach_routine_template;
create policy "crt_personalized_subscriber_select" on coach_routine_template
  for select using (
    exists (
      select 1
      from coaching_subscription s
      where s.personalized_template_id = coach_routine_template.id
        and s.user_id = auth.uid()
    )
  );
