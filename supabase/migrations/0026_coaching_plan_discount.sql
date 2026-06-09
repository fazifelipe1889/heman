-- Agrega descuento en porcentaje y color de acento a coaching_plan.
-- discount_pct: 0–99 (0 = sin descuento).
-- accent_color: hex color para resaltar la tarjeta de precio (#xxxxxx).

alter table coaching_plan
  add column if not exists discount_pct smallint not null default 0 check (discount_pct between 0 and 99),
  add column if not exists accent_color text;
