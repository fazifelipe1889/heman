-- =============================================================================
-- MIGRATION: 0023_coaching_reviews_media
-- Descripción: Reseñas del cliente con imagen + control de publicación.
--   - image_url: 1 imagen opcional que adjunta el cliente a su reseña.
--   - is_published: el coach puede ocultar una reseña de su vitrina pública
--     (default true = visible).
--   Sin cambios de RLS: la lectura pública de coaching_review ya existe; el
--   filtrado por is_published se hace en la query/UI.
-- =============================================================================

alter table coaching_review
  add column if not exists image_url text;

alter table coaching_review
  add column if not exists is_published boolean not null default true;
