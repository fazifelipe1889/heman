-- Revisiones corporales del usuario
create table public.body_reviews (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  review_date         date        not null default current_date,

  -- Medidas básicas
  weight_kg           numeric(5,2),
  height_cm           numeric(5,1),

  -- Composición corporal
  body_fat_pct        numeric(4,1),
  muscle_mass_kg      numeric(5,2),
  bone_mass_kg        numeric(4,2),
  water_pct           numeric(4,1),
  visceral_fat        numeric(4,1),

  -- Medidas corporales (cm)
  chest_cm            numeric(5,1),
  waist_cm            numeric(5,1),
  hips_cm             numeric(5,1),
  abdomen_cm          numeric(5,1),
  neck_cm             numeric(5,1),
  shoulder_cm         numeric(5,1),

  -- Extremidades (cm)
  arm_left_cm         numeric(5,1),
  arm_right_cm        numeric(5,1),
  forearm_left_cm     numeric(5,1),
  forearm_right_cm    numeric(5,1),
  thigh_left_cm       numeric(5,1),
  thigh_right_cm      numeric(5,1),
  calf_left_cm        numeric(5,1),
  calf_right_cm       numeric(5,1),

  -- Salud
  systolic_bp         integer,
  diastolic_bp        integer,
  resting_hr          integer,
  spo2                numeric(4,1),

  -- Bienestar subjetivo
  sleep_hours         numeric(4,1),
  energy_level        integer check (energy_level between 1 and 10),
  stress_level        integer check (stress_level between 1 and 10),

  -- Notas libres
  notes               text,

  created_at          timestamptz not null default now()
);

alter table public.body_reviews enable row level security;

create policy "users manage own reviews"
  on public.body_reviews for all
  using  (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create index body_reviews_user_date on public.body_reviews(user_id, review_date desc);
