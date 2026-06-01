-- =============================================================================
-- MIGRATION: 0014_coaching_realtime
-- Descripción: Habilita Supabase Realtime para el chat de asesorías.
--              Sin esto, el ChatPanel no recibe mensajes en vivo (igual
--              funciona el envío optimista, pero no el push del otro lado).
-- =============================================================================

-- Agregar coaching_message a la publicación de realtime.
-- Idempotente: si ya está agregada, ignora el error.
do $$
begin
  alter publication supabase_realtime add table coaching_message;
exception
  when duplicate_object then null;
  when undefined_object then
    -- La publicación no existe en este proyecto: crearla.
    create publication supabase_realtime for table coaching_message;
end $$;

-- Para que los filtros por subscription_id funcionen en realtime con RLS,
-- la identidad de réplica debe incluir las columnas filtrables.
alter table coaching_message replica identity full;
