-- =============================================================================
-- MIGRATION: 0022_coaching_products
-- Descripción: Reestructura a "productos planos". Cada producto que ve el
--   cliente es una asesoría (servicio personalizado) o un plan (info/guía
--   estática). Internamente sigue siendo coaching_program (1) + coaching_plan (1)
--   para no romper checkout/suscripción/pagos/provisioning (cableados a plan_id).
--
--   coaching_program gana:
--     - product_type: distingue asesoría vs plan.
--     - short_description: "descripción corta" de la vitrina (tagline = gancho,
--       description = descripción larga, includes = checklist, cover_url = imagen).
--
--   coach_profiles gana (carta de presentación + footer de contacto):
--     - location: ubicación aproximada.
--     - public_email: mail de contacto público.
--     - faq: preguntas frecuentes a nivel coach (array de {question, answer}).
--
--   Sin cambios de RLS: las policies públicas por status='active'/'published'
--   ya cubren las columnas nuevas.
-- =============================================================================

-- Productos (coaching_program) -------------------------------------------------
alter table coaching_program
  add column if not exists product_type text not null default 'asesoria'
    check (product_type in ('asesoria', 'plan'));

alter table coaching_program
  add column if not exists short_description text;

-- Carta de presentación del coach ---------------------------------------------
alter table coach_profiles
  add column if not exists location text;

alter table coach_profiles
  add column if not exists public_email text;

alter table coach_profiles
  add column if not exists faq jsonb not null default '[]'::jsonb;
