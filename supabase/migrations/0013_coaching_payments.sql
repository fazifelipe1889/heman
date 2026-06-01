-- =============================================================================
-- MIGRATION: 0013_coaching_payments
-- Descripción: Tablas de pagos y reseñas
--              - coaching_payment (historial de pagos)
--              - coaching_review (reseñas de clientes sobre asesorías)
-- =============================================================================

-- =============================================================================
-- TABLA: coaching_payment
-- Registro de cada transacción (pago, refund, chargebacks)
-- =============================================================================
create table if not exists coaching_payment (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid references coaching_subscription(id) on delete set null,
  user_id           uuid not null references auth.users(id) on delete cascade,
  coach_id          uuid not null references coach_profiles(id) on delete cascade,
  program_id        uuid not null references coaching_program(id) on delete cascade,
  provider          text not null check (provider in ('mercadopago', 'stripe')),
  provider_ref      text not null,
  amount_cents      int not null,
  currency          text not null default 'ARS',
  commission_cents  int not null,
  net_cents         int not null,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded', 'charged_back')),
  raw_event         jsonb,
  created_at        timestamptz default now(),
  unique (provider, provider_ref)
);

create index idx_coaching_payment_user_id on coaching_payment(user_id);
create index idx_coaching_payment_coach_id on coaching_payment(coach_id);
create index idx_coaching_payment_subscription_id on coaching_payment(subscription_id);
create index idx_coaching_payment_status on coaching_payment(status);
create index idx_coaching_payment_created_at on coaching_payment(created_at);

-- =============================================================================
-- TABLA: coaching_review
-- Reseña/calificación del cliente sobre la asesoría después de expirar
-- =============================================================================
create table if not exists coaching_review (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null unique references coaching_subscription(id) on delete cascade,
  program_id       uuid not null references coaching_program(id) on delete cascade,
  coach_id         uuid not null references coach_profiles(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  rating           int not null check (rating between 1 and 5),
  comment          text,
  created_at       timestamptz default now()
);

create index idx_coaching_review_program_id on coaching_review(program_id);
create index idx_coaching_review_coach_id on coaching_review(coach_id);
create index idx_coaching_review_user_id on coaching_review(user_id);

-- =============================================================================
-- POLÍTICAS RLS
-- =============================================================================

-- coaching_payment: usuario ve sus propios pagos + coach ve los suyos (filtrado)
alter table coaching_payment enable row level security;

drop policy if exists "coaching_payment_user_coach" on coaching_payment;
create policy "coaching_payment_user_coach" on coaching_payment
  for select using (
    auth.uid() = user_id or auth.uid() = coach_id
  );

-- coaching_review: público si se publica (opcional futura feature), usuario ve sus propias, coach ve las suyas
alter table coaching_review enable row level security;

drop policy if exists "coaching_review_read" on coaching_review;
create policy "coaching_review_read" on coaching_review
  for select using (
    auth.uid() = user_id or auth.uid() = coach_id or true  -- públicas para todos (modelo actual)
  );

drop policy if exists "coaching_review_insert" on coaching_review;
create policy "coaching_review_insert" on coaching_review
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from coaching_subscription s
      where s.id = subscription_id
        and s.user_id = auth.uid()
        and s.status in ('expired', 'cancelled')  -- solo tras expirar
    )
  );

-- =============================================================================
-- TRIGGERS / FUNCIONES
-- =============================================================================

-- Función: al aprobar pago (WEBHOOK), actualizar suscripción + rating del coach
create or replace function approve_coaching_payment(payment_id uuid)
returns boolean as $$
declare
  v_subscription_id uuid;
  v_coach_id uuid;
  v_amount_cents int;
  v_commission_cents int;
  v_net_cents int;
begin
  -- Obtener datos del pago
  select subscription_id, coach_id, amount_cents, commission_cents, net_cents
  into v_subscription_id, v_coach_id, v_amount_cents, v_commission_cents, v_net_cents
  from coaching_payment
  where id = payment_id;

  if v_subscription_id is null then
    raise exception 'Payment not found or subscription_id is null';
  end if;

  -- Marcar pago como aprobado
  update coaching_payment
  set status = 'approved'
  where id = payment_id;

  -- Marcar suscripción como activa (startups via provisioning en Edge Function)
  update coaching_subscription
  set status = 'active'
  where id = v_subscription_id;

  return true;
end;
$$ language plpgsql;

-- Función: al insertar reseña, recalcular rating del coach
create or replace function handle_coaching_review_insert()
returns trigger as $$
declare
  v_avg_rating numeric;
  v_count_reviews int;
begin
  -- Calcular nuevo rating promedio
  select
    coalesce(avg(rating), 0),
    count(*)
  into v_avg_rating, v_count_reviews
  from coaching_review
  where coach_id = new.coach_id;

  -- Actualizar en coach_profiles
  update coach_profiles
  set
    rating_avg = round(v_avg_rating, 2),
    rating_count = v_count_reviews
  where id = new.coach_id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_coaching_review_insert_trigger on coaching_review;
create trigger handle_coaching_review_insert_trigger
after insert on coaching_review for each row
execute function handle_coaching_review_insert();

-- Función: al eliminar reseña, recalcular rating
create or replace function handle_coaching_review_delete()
returns trigger as $$
declare
  v_avg_rating numeric;
  v_count_reviews int;
begin
  -- Calcular nuevo rating promedio
  select
    coalesce(avg(rating), 0),
    count(*)
  into v_avg_rating, v_count_reviews
  from coaching_review
  where coach_id = old.coach_id;

  -- Actualizar en coach_profiles
  update coach_profiles
  set
    rating_avg = round(v_avg_rating, 2),
    rating_count = v_count_reviews
  where id = old.coach_id;

  return old;
end;
$$ language plpgsql;

drop trigger if exists handle_coaching_review_delete_trigger on coaching_review;
create trigger handle_coaching_review_delete_trigger
after delete on coaching_review for each row
execute function handle_coaching_review_delete();

-- =============================================================================
-- FUNCIÓN PÚBLICA PARA EL WEBHOOK
-- =============================================================================
-- Llamada desde la Edge Function (service_role)
-- Idempotencia: valida unique (provider, provider_ref)
create or replace function handle_coaching_webhook_payment(
  p_provider text,
  p_provider_ref text,
  p_subscription_id uuid,
  p_user_id uuid,
  p_coach_id uuid,
  p_program_id uuid,
  p_amount_cents int,
  p_commission_cents int,
  p_net_cents int,
  p_status text,
  p_raw_event jsonb
)
returns jsonb as $$
declare
  v_payment_id uuid;
  v_already_processed bool;
begin
  -- Verificar idempotencia
  select id into v_payment_id from coaching_payment
  where provider = p_provider and provider_ref = p_provider_ref
  limit 1;

  if v_payment_id is not null then
    return jsonb_build_object('status', 'already_processed', 'payment_id', v_payment_id);
  end if;

  -- Insertar pago
  insert into coaching_payment (
    subscription_id, user_id, coach_id, program_id,
    provider, provider_ref,
    amount_cents, currency, commission_cents, net_cents,
    status, raw_event
  ) values (
    p_subscription_id, p_user_id, p_coach_id, p_program_id,
    p_provider, p_provider_ref,
    p_amount_cents, 'ARS', p_commission_cents, p_net_cents,
    p_status, p_raw_event
  ) returning id into v_payment_id;

  -- Si aprobado, marcar suscripción como active (el provisioning ocurre en la Edge Function)
  if p_status = 'approved' and p_subscription_id is not null then
    update coaching_subscription
    set
      status = 'active',
      starts_at = now(),
      ends_at = now() + (select duration_days from coaching_plan where id = (select plan_id from coaching_subscription where id = p_subscription_id))::text::interval,
      last_payment_id = v_payment_id
    where id = p_subscription_id;
  end if;

  return jsonb_build_object(
    'status', 'created',
    'payment_id', v_payment_id
  );
end;
$$ language plpgsql;
