-- =============================================================================
-- MIGRATION: 0021_fix_function_search_paths
-- Descripción: Pina search_path = '' en todas las funciones plpgsql que no lo
--              tenían, y califica tablas con public. para evitar search_path
--              hijacking. También corrige un bug en handle_coaching_webhook_payment
--              donde duration_days::text::interval producía segundos, no días.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Triggers simples de updated_at (no referencian tablas externas)
-- ---------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_coach_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_coaching_program_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_coaching_plan_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_coaching_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_coaching_transformation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create or replace function public.handle_coaching_message_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_thread_id uuid;
begin
  select id into v_thread_id
  from public.coaching_thread
  where subscription_id = new.subscription_id
  limit 1;

  if v_thread_id is not null then
    update public.coaching_thread
    set
      last_message_at = new.created_at,
      coach_unread = case when new.sender_role = 'user' then coach_unread + 1 else coach_unread end,
      user_unread  = case when new.sender_role = 'coach' then user_unread + 1 else user_unread end
    where id = v_thread_id;
  end if;

  return new;
end;
$$;

create or replace function public.mark_coaching_message_read(message_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_sender_role    text;
  v_subscription_id uuid;
begin
  select sender_role, subscription_id
  into v_sender_role, v_subscription_id
  from public.coaching_message
  where id = message_id;

  update public.coaching_message
  set read_at = now()
  where id = message_id and read_at is null;

  if found and v_subscription_id is not null then
    if v_sender_role = 'coach' then
      update public.coaching_thread
      set user_unread = greatest(0, user_unread - 1)
      where subscription_id = v_subscription_id;
    else
      update public.coaching_thread
      set coach_unread = greatest(0, coach_unread - 1)
      where subscription_id = v_subscription_id;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pagos y reseñas
-- ---------------------------------------------------------------------------

create or replace function public.approve_coaching_payment(payment_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_subscription_id  uuid;
  v_coach_id         uuid;
  v_amount_cents     int;
  v_commission_cents int;
  v_net_cents        int;
begin
  select subscription_id, coach_id, amount_cents, commission_cents, net_cents
  into v_subscription_id, v_coach_id, v_amount_cents, v_commission_cents, v_net_cents
  from public.coaching_payment
  where id = payment_id;

  if v_subscription_id is null then
    raise exception 'Payment not found or subscription_id is null';
  end if;

  update public.coaching_payment
  set status = 'approved'
  where id = payment_id;

  update public.coaching_subscription
  set status = 'active'
  where id = v_subscription_id;

  return true;
end;
$$;

create or replace function public.handle_coaching_review_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_avg_rating   numeric;
  v_count_reviews int;
begin
  select coalesce(avg(rating), 0), count(*)
  into v_avg_rating, v_count_reviews
  from public.coaching_review
  where coach_id = new.coach_id;

  update public.coach_profiles
  set
    rating_avg   = round(v_avg_rating, 2),
    rating_count = v_count_reviews
  where id = new.coach_id;

  return new;
end;
$$;

create or replace function public.handle_coaching_review_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_avg_rating   numeric;
  v_count_reviews int;
begin
  select coalesce(avg(rating), 0), count(*)
  into v_avg_rating, v_count_reviews
  from public.coaching_review
  where coach_id = old.coach_id;

  update public.coach_profiles
  set
    rating_avg   = round(v_avg_rating, 2),
    rating_count = v_count_reviews
  where id = old.coach_id;

  return old;
end;
$$;

-- ---------------------------------------------------------------------------
-- Webhook de pago (función crítica)
-- Corrección: duration_days::text::interval producía segundos, no días.
-- Ahora usa make_interval(days => N) que es inequívoco.
-- ---------------------------------------------------------------------------

create or replace function public.handle_coaching_webhook_payment(
  p_provider        text,
  p_provider_ref    text,
  p_subscription_id uuid,
  p_user_id         uuid,
  p_coach_id        uuid,
  p_program_id      uuid,
  p_amount_cents    int,
  p_commission_cents int,
  p_net_cents       int,
  p_status          text,
  p_raw_event       jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_payment_id  uuid;
  v_duration_days int;
begin
  -- Idempotencia: ya procesado
  select id into v_payment_id
  from public.coaching_payment
  where provider = p_provider and provider_ref = p_provider_ref
  limit 1;

  if v_payment_id is not null then
    return jsonb_build_object('status', 'already_processed', 'payment_id', v_payment_id);
  end if;

  insert into public.coaching_payment (
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

  if p_status = 'approved' and p_subscription_id is not null then
    select cp.duration_days into v_duration_days
    from public.coaching_plan cp
    join public.coaching_subscription cs on cs.plan_id = cp.id
    where cs.id = p_subscription_id;

    update public.coaching_subscription
    set
      status          = 'active',
      starts_at       = now(),
      ends_at         = now() + make_interval(days => v_duration_days),
      last_payment_id = v_payment_id
    where id = p_subscription_id;
  end if;

  return jsonb_build_object('status', 'created', 'payment_id', v_payment_id);
end;
$$;
