-- =============================================================================
-- MIGRATION: 0020_coaching_plan_marketing
-- Descripción: Campos de marketing del plan para la "landing de venta pro".
--   - is_featured: el coach marca un plan como destacado (reemplaza el highlight
--     hardcodeado i===1 de la landing).
--   - price_usd_cents: precio opcional en USD para mostrar doble moneda
--     (el coach lo setea a mano; null = no se muestra USD).
-- =============================================================================

alter table coaching_plan
  add column if not exists is_featured boolean default false;

alter table coaching_plan
  add column if not exists price_usd_cents int;
