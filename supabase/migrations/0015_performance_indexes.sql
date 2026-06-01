-- ============================================================================
-- MIGRATION: 0015_performance_indexes
-- Descripción: Índices adicionales para optimizar queries de performance
--              Ya existen la mayoría, pero estos agregan mejoras específicas
-- ============================================================================

-- Índices para queries frecuentes sin FK explícita
-- Si alguno ya existe, PostgreSQL lo ignorará

-- Marketplace: búsqueda rápida de programas activos por coach (frecuente en catálogo)
create index if not exists idx_coaching_program_coach_published
  on coaching_program(coach_id, status)
  where status = 'published';

-- Suscripciones activas por usuario (frecuente en dashboard)
create index if not exists idx_coaching_subscription_user_active
  on coaching_subscription(user_id, status)
  where status = 'active';

-- Planes visibles por programa (frecuente en landing coach)
create index if not exists idx_coaching_plan_program_visible
  on coaching_plan(program_id)
  where is_visible = true;

-- Chat: últimos mensajes rápidos
create index if not exists idx_coaching_message_subscription_created
  on coaching_message(subscription_id, created_at desc);

-- Pagos pendientes/completados por coach (reportes de earnings)
create index if not exists idx_coaching_payment_coach_status
  on coaching_payment(coach_id, status);

-- Sesiones completadas por usuario (historial en Progreso)
create index if not exists idx_workout_sessions_user_completed
  on workout_sessions(user_id, started_at desc)
  where status = 'completed';

-- Planes activos por usuario (para búsquedas rápidas sin JOIN)
create index if not exists idx_plans_user_active
  on plans(user_id, is_active)
  where is_active = true;

-- Para deduplicación en /train/[type]: rutinas favoritas del usuario
create index if not exists idx_routines_user_favorite
  on routines(user_id, is_favorite)
  where is_favorite = true;

-- Plan days filtrado por día actual (query frecuente en /train)
create index if not exists idx_plan_days_day_of_week
  on plan_days(plan_id, day_of_week);

-- Coaching: threads por usuario, ordenados por último mensaje
create index if not exists idx_coaching_thread_user_last_message
  on coaching_thread(user_id, last_message_at desc);
