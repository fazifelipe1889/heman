/**
 * Data layer del sistema de asesorías (coaching marketplace).
 *
 * Funciones puras que reciben el cliente Supabase como primer argumento.
 * No conocen React/Next: las server actions las orquestan.
 *
 * Convención de errores: se hace `throw error` y la capa de actions decide
 * cómo presentarlo. RLS protege a nivel BD; estas queries asumen que el
 * cliente ya está autenticado con el rol correcto.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  Database,
  CoachProfile,
  CoachProfileInsert,
  CoachingProgram,
  CoachingProgramInsert,
  CoachRoutineTemplate,
  CoachRoutineTemplateInsert,
  CoachSupplementTemplate,
  CoachSupplementTemplateInsert,
  CoachingPlan,
  CoachingPlanInsert,
  CoachingSubscription,
  CoachingThread,
  CoachingMessage,
  CoachingMessageInsert,
  CoachingPayment,
  CoachingReview,
  CoachingReviewInsert,
  CoachingTransformation,
  CoachingTransformationInsert,
} from "@/lib/supabase/types"
import type {
  CoachStatus,
  CoachingCategory,
  CoachingProgramStatus,
  SubscriptionStatus,
  PaymentStatus,
} from "@/lib/domain/coaching"

type Client = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Tipos compuestos (resultados con joins)
// ---------------------------------------------------------------------------

/** Programa publicado con su coach embebido (para el catálogo). */
export type MarketplaceProgram = CoachingProgram & {
  coach: Pick<
    CoachProfile,
    "id" | "handle" | "display_name" | "avatar_url" | "rating_avg" | "rating_count" | "is_verified"
  >
  plans: CoachingPlan[]
  price_from_cents: number | null
}

/** Detalle completo de la landing pública de una asesoría. */
export type ProgramLandingDetail = CoachingProgram & {
  coach: CoachProfile
  plans: CoachingPlan[]
  reviews: CoachingReview[]
  transformations: CoachingTransformation[]
}

/** Suscripción con datos del coach/programa para el panel del usuario. */
export type SubscriptionWithContext = CoachingSubscription & {
  coach: Pick<CoachProfile, "id" | "handle" | "display_name" | "avatar_url">
  program: Pick<CoachingProgram, "id" | "title" | "slug" | "cover_url">
  plan: Pick<CoachingPlan, "id" | "name" | "duration_days">
}

/** Cliente del coach (suscripción + datos básicos del usuario). */
export type CoachClient = CoachingSubscription & {
  program: Pick<CoachingProgram, "id" | "title">
  plan: Pick<CoachingPlan, "id" | "name">
}

/** Thread del inbox del coach con el último mensaje. */
export type CoachInboxThread = CoachingThread & {
  subscription: Pick<CoachingSubscription, "id" | "status" | "user_id">
}

// =============================================================================
// COACH PROFILES
// =============================================================================

/** Perfil de coach por id de usuario. Devuelve null si no es coach. */
export async function getCoachProfile(
  supabase: Client,
  coachId: string
): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("id", coachId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Perfil de coach por handle público (landing). Solo devuelve activos. */
export async function getCoachProfileByHandle(
  supabase: Client,
  handle: string
): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Verifica disponibilidad de un handle (case-insensitive). */
export async function isHandleAvailable(
  supabase: Client,
  handle: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle()
  if (error) throw error
  return data === null
}

/** Crea el perfil de coach (queda en 'pending_review' hasta aprobación). */
export async function createCoachProfile(
  supabase: Client,
  userId: string,
  input: Omit<CoachProfileInsert, "id">
): Promise<CoachProfile> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .insert({ ...input, id: userId })
    .select("*")
    .single()
  if (error) throw error
  return data
}

/** Actualiza el perfil del coach (campos editables por el dueño). */
export async function updateCoachProfile(
  supabase: Client,
  coachId: string,
  patch: Database["public"]["Tables"]["coach_profiles"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("coach_profiles")
    .update(patch)
    .eq("id", coachId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Admin: moderación de coaches
// ---------------------------------------------------------------------------

/** Lista coaches por estado (admin). */
export async function listCoachesByStatus(
  supabase: Client,
  status: CoachStatus
): Promise<CoachProfile[]> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Cambia el estado de un coach (admin: aprobar/rechazar/suspender). */
export async function setCoachStatus(
  supabase: Client,
  coachId: string,
  status: CoachStatus
): Promise<void> {
  const { error } = await supabase
    .from("coach_profiles")
    .update({ status })
    .eq("id", coachId)
  if (error) throw error
}

// =============================================================================
// COACHING PROGRAMS
// =============================================================================

/** Lista todos los programas de un coach (cualquier estado, para su panel). */
export async function listCoachPrograms(
  supabase: Client,
  coachId: string
): Promise<CoachingProgram[]> {
  const { data, error } = await supabase
    .from("coaching_program")
    .select("*")
    .eq("coach_id", coachId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Programa por id. */
export async function getCoachingProgram(
  supabase: Client,
  programId: string
): Promise<CoachingProgram | null> {
  const { data, error } = await supabase
    .from("coaching_program")
    .select("*")
    .eq("id", programId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Crea un programa nuevo (queda en 'draft'). */
export async function createCoachingProgram(
  supabase: Client,
  input: CoachingProgramInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coaching_program")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

/** Actualiza un programa. */
export async function updateCoachingProgram(
  supabase: Client,
  programId: string,
  patch: Database["public"]["Tables"]["coaching_program"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("coaching_program")
    .update(patch)
    .eq("id", programId)
  if (error) throw error
}

/** Cambia el estado de publicación de un programa. */
export async function setProgramStatus(
  supabase: Client,
  programId: string,
  status: CoachingProgramStatus
): Promise<void> {
  const patch: Database["public"]["Tables"]["coaching_program"]["Update"] = {
    status,
  }
  if (status === "published") patch.published_at = new Date().toISOString()
  const { error } = await supabase
    .from("coaching_program")
    .update(patch)
    .eq("id", programId)
  if (error) throw error
}

/** Elimina un programa (cascada borra planes). */
export async function deleteCoachingProgram(
  supabase: Client,
  programId: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_program")
    .delete()
    .eq("id", programId)
  if (error) throw error
}

// =============================================================================
// COACHING PLANS
// =============================================================================

/** Lista los planes de un programa (todos, para el panel del coach). */
export async function listProgramPlans(
  supabase: Client,
  programId: string
): Promise<CoachingPlan[]> {
  const { data, error } = await supabase
    .from("coaching_plan")
    .select("*")
    .eq("program_id", programId)
    .order("position", { ascending: true })
    .order("price_cents", { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Plan por id. */
export async function getCoachingPlan(
  supabase: Client,
  planId: string
): Promise<CoachingPlan | null> {
  const { data, error } = await supabase
    .from("coaching_plan")
    .select("*")
    .eq("id", planId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Crea un plan dentro de un programa. */
export async function createCoachingPlan(
  supabase: Client,
  input: CoachingPlanInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coaching_plan")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

/** Actualiza un plan. */
export async function updateCoachingPlan(
  supabase: Client,
  planId: string,
  patch: Database["public"]["Tables"]["coaching_plan"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("coaching_plan")
    .update(patch)
    .eq("id", planId)
  if (error) throw error
}

/** Elimina un plan. */
export async function deleteCoachingPlan(
  supabase: Client,
  planId: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_plan")
    .delete()
    .eq("id", planId)
  if (error) throw error
}

// =============================================================================
// TRANSFORMACIONES (prueba social: casos antes/después)
// =============================================================================

/** Transformaciones de un coach (gestión en el panel). */
export async function listCoachTransformations(
  supabase: Client,
  coachId: string
): Promise<CoachingTransformation[]> {
  const { data, error } = await supabase
    .from("coaching_transformation")
    .select("*")
    .eq("coach_id", coachId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Una transformación por id. */
export async function getCoachTransformation(
  supabase: Client,
  id: string
): Promise<CoachingTransformation | null> {
  const { data, error } = await supabase
    .from("coaching_transformation")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Crea una transformación. */
export async function createCoachTransformation(
  supabase: Client,
  input: CoachingTransformationInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coaching_transformation")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

/** Actualiza una transformación. */
export async function updateCoachTransformation(
  supabase: Client,
  id: string,
  patch: Database["public"]["Tables"]["coaching_transformation"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("coaching_transformation")
    .update(patch)
    .eq("id", id)
  if (error) throw error
}

/** Elimina una transformación. */
export async function deleteCoachTransformation(
  supabase: Client,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_transformation")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// =============================================================================
// TEMPLATES (rutinas y suplementación reutilizables del coach)
// =============================================================================

export async function listRoutineTemplates(
  supabase: Client,
  coachId: string
): Promise<CoachRoutineTemplate[]> {
  const { data, error } = await supabase
    .from("coach_routine_template")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createRoutineTemplate(
  supabase: Client,
  input: CoachRoutineTemplateInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coach_routine_template")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

export async function deleteRoutineTemplate(
  supabase: Client,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from("coach_routine_template")
    .delete()
    .eq("id", templateId)
  if (error) throw error
}

export async function listSupplementTemplates(
  supabase: Client,
  coachId: string
): Promise<CoachSupplementTemplate[]> {
  const { data, error } = await supabase
    .from("coach_supplement_template")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSupplementTemplate(
  supabase: Client,
  input: CoachSupplementTemplateInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coach_supplement_template")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

export async function deleteSupplementTemplate(
  supabase: Client,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from("coach_supplement_template")
    .delete()
    .eq("id", templateId)
  if (error) throw error
}

// =============================================================================
// MARKETPLACE (catálogo público)
// =============================================================================

/**
 * Lista programas publicados con su coach y precio "desde".
 * RLS garantiza que solo se vean programas con status='published'.
 */
export async function listMarketplacePrograms(
  supabase: Client,
  filters: { category?: CoachingCategory; search?: string; coachId?: string } = {}
): Promise<MarketplaceProgram[]> {
  let query = supabase
    .from("coaching_program")
    .select(
      `*,
       coach:coach_profiles!coaching_program_coach_id_fkey(id, handle, display_name, avatar_url, rating_avg, rating_count, is_verified),
       plans:coaching_plan(*)`
    )
    .eq("status", "published")

  if (filters.category) query = query.eq("category", filters.category)
  if (filters.coachId) query = query.eq("coach_id", filters.coachId)
  if (filters.search) query = query.ilike("title", `%${filters.search}%`)

  const { data, error } = await query.order("position", { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => {
    const plans = ((row.plans as CoachingPlan[]) ?? []).filter(
      (p) => p.is_visible
    )
    const priceFrom =
      plans.length > 0 ? Math.min(...plans.map((p) => p.price_cents)) : null
    return {
      ...(row as unknown as CoachingProgram),
      coach: row.coach as MarketplaceProgram["coach"],
      plans,
      price_from_cents: priceFrom,
    }
  })
}

/**
 * Detalle completo de la landing de una asesoría (por handle + slug).
 * Incluye coach, planes visibles y reseñas.
 */
export async function getProgramLanding(
  supabase: Client,
  handle: string,
  slug: string
): Promise<ProgramLandingDetail | null> {
  const coach = await getCoachProfileByHandle(supabase, handle)
  if (!coach) return null

  const { data: program, error } = await supabase
    .from("coaching_program")
    .select("*")
    .eq("coach_id", coach.id)
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw error
  if (!program) return null

  const [plansRes, reviewsRes, transformationsRes] = await Promise.all([
    supabase
      .from("coaching_plan")
      .select("*")
      .eq("program_id", program.id)
      .eq("is_visible", true)
      .order("position", { ascending: true })
      .order("price_cents", { ascending: true }),
    supabase
      .from("coaching_review")
      .select("*")
      .eq("program_id", program.id)
      .order("created_at", { ascending: false })
      .limit(20),
    // Transformaciones específicas de esta asesoría + las generales del coach.
    supabase
      .from("coaching_transformation")
      .select("*")
      .eq("coach_id", coach.id)
      .or(`program_id.eq.${program.id},program_id.is.null`)
      .order("position", { ascending: true })
      .limit(20),
  ])
  if (plansRes.error) throw plansRes.error
  if (reviewsRes.error) throw reviewsRes.error
  // Las transformaciones son prueba social opcional: si la tabla aún no fue
  // migrada (0019) o la query falla, degradamos sin romper la landing pública.
  const transformations = transformationsRes.error
    ? []
    : transformationsRes.data ?? []

  return {
    ...program,
    coach,
    plans: plansRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    transformations,
  }
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

/** Suscripción activa del usuario (bloque "Mi Asesoría"). */
export async function getUserActiveSubscription(
  supabase: Client,
  userId: string
): Promise<SubscriptionWithContext | null> {
  // limit(1) en lugar de maybeSingle(): si por datos viejos hubiera más de una
  // suscripción activa, tomamos la de vencimiento más lejano en vez de romper.
  const { data: rows, error } = await supabase
    .from("coaching_subscription")
    .select(
      `*,
       coach:coach_profiles!coaching_subscription_coach_id_fkey(id, handle, display_name, avatar_url),
       program:coaching_program!coaching_subscription_program_id_fkey(id, title, slug, cover_url),
       plan:coaching_plan!coaching_subscription_plan_id_fkey(id, name, duration_days)`
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("ends_at", { ascending: false })
    .limit(1)
  if (error) throw error
  const data = rows?.[0]
  if (!data) return null
  return {
    ...(data as unknown as CoachingSubscription),
    coach: data.coach as SubscriptionWithContext["coach"],
    program: data.program as SubscriptionWithContext["program"],
    plan: data.plan as SubscriptionWithContext["plan"],
  }
}

/**
 * Cancela una suscripción activa del usuario (marca status='cancelled').
 * Valida pertenencia vía RLS (policy de UPDATE solo permite auth.uid() = user_id).
 */
export async function cancelUserSubscription(
  supabase: Client,
  subscriptionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_subscription")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId)
    .eq("user_id", userId)
    .eq("status", "active")
  if (error) throw error
}

/** Historial de suscripciones del usuario. */
export async function listUserSubscriptions(
  supabase: Client,
  userId: string
): Promise<SubscriptionWithContext[]> {
  const { data, error } = await supabase
    .from("coaching_subscription")
    .select(
      `*,
       coach:coach_profiles!coaching_subscription_coach_id_fkey(id, handle, display_name, avatar_url),
       program:coaching_program!coaching_subscription_program_id_fkey(id, title, slug, cover_url),
       plan:coaching_plan!coaching_subscription_plan_id_fkey(id, name, duration_days)`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...(row as unknown as CoachingSubscription),
    coach: row.coach as SubscriptionWithContext["coach"],
    program: row.program as SubscriptionWithContext["program"],
    plan: row.plan as SubscriptionWithContext["plan"],
  }))
}

/** Suscripción por id (con contexto). Valida pertenencia vía RLS. */
export async function getSubscriptionDetail(
  supabase: Client,
  subscriptionId: string
): Promise<SubscriptionWithContext | null> {
  const { data, error } = await supabase
    .from("coaching_subscription")
    .select(
      `*,
       coach:coach_profiles!coaching_subscription_coach_id_fkey(id, handle, display_name, avatar_url),
       program:coaching_program!coaching_subscription_program_id_fkey(id, title, slug, cover_url),
       plan:coaching_plan!coaching_subscription_plan_id_fkey(id, name, duration_days)`
    )
    .eq("id", subscriptionId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...(data as unknown as CoachingSubscription),
    coach: data.coach as SubscriptionWithContext["coach"],
    program: data.program as SubscriptionWithContext["program"],
    plan: data.plan as SubscriptionWithContext["plan"],
  }
}

/** Lista los clientes de un coach (suscripciones). */
export async function listCoachClients(
  supabase: Client,
  coachId: string,
  filters: { status?: SubscriptionStatus } = {}
): Promise<CoachClient[]> {
  let query = supabase
    .from("coaching_subscription")
    .select(
      `*,
       program:coaching_program!coaching_subscription_program_id_fkey(id, title),
       plan:coaching_plan!coaching_subscription_plan_id_fkey(id, name)`
    )
    .eq("coach_id", coachId)

  if (filters.status) query = query.eq("status", filters.status)

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...(row as unknown as CoachingSubscription),
    program: row.program as CoachClient["program"],
    plan: row.plan as CoachClient["plan"],
  }))
}

/** Actualiza las notas privadas del coach sobre un cliente. */
export async function updateCoachNotes(
  supabase: Client,
  subscriptionId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_subscription")
    .update({ coach_notes: notes })
    .eq("id", subscriptionId)
  if (error) throw error
}

/**
 * Cuenta de suscripciones activas de un usuario.
 * Útil para validar el límite antes de iniciar un checkout.
 */
export async function countActiveSubscriptions(
  supabase: Client,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("coaching_subscription")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")
  if (error) throw error
  return count ?? 0
}

// =============================================================================
// CHAT (threads + mensajes)
// =============================================================================

/** Thread de una suscripción. */
export async function getThread(
  supabase: Client,
  subscriptionId: string
): Promise<CoachingThread | null> {
  const { data, error } = await supabase
    .from("coaching_thread")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Inbox del coach: threads ordenados por último mensaje. */
export async function listCoachThreads(
  supabase: Client,
  coachId: string
): Promise<CoachInboxThread[]> {
  const { data, error } = await supabase
    .from("coaching_thread")
    .select(
      `*,
       subscription:coaching_subscription!coaching_thread_subscription_id_fkey(id, status, user_id)`
    )
    .eq("coach_id", coachId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...(row as unknown as CoachingThread),
    subscription: row.subscription as CoachInboxThread["subscription"],
  }))
}

/** Mensajes de un thread, en orden cronológico (paginado simple). */
export async function listMessages(
  supabase: Client,
  subscriptionId: string,
  opts: { limit?: number; before?: string } = {}
): Promise<CoachingMessage[]> {
  let query = supabase
    .from("coaching_message")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.before) query = query.lt("created_at", opts.before)

  const { data, error } = await query
  if (error) throw error
  // Devolver en orden cronológico ascendente para renderizar.
  return (data ?? []).reverse()
}

/** Envía un mensaje. El trigger actualiza el thread y los contadores. */
export async function sendMessage(
  supabase: Client,
  input: CoachingMessageInsert
): Promise<CoachingMessage> {
  const { data, error } = await supabase
    .from("coaching_message")
    .insert(input)
    .select("*")
    .single()
  if (error) throw error
  return data
}

/**
 * Marca como leídos todos los mensajes recibidos en un thread.
 * `readerRole` es el rol de quien lee (lee los mensajes del otro rol).
 */
export async function markThreadRead(
  supabase: Client,
  subscriptionId: string,
  readerRole: "coach" | "user"
): Promise<void> {
  const senderToRead = readerRole === "coach" ? "user" : "coach"
  const { error } = await supabase
    .from("coaching_message")
    .update({ read_at: new Date().toISOString() })
    .eq("subscription_id", subscriptionId)
    .eq("sender_role", senderToRead)
    .is("read_at", null)
  if (error) throw error

  // Resetear el contador del lector en el thread.
  const counterPatch =
    readerRole === "coach" ? { coach_unread: 0 } : { user_unread: 0 }
  const { error: tErr } = await supabase
    .from("coaching_thread")
    .update(counterPatch)
    .eq("subscription_id", subscriptionId)
  if (tErr) throw tErr
}

// =============================================================================
// PAYMENTS (lecturas; las escrituras van por la Edge Function / RPC)
// =============================================================================

/** Pagos del usuario. */
export async function listUserPayments(
  supabase: Client,
  userId: string
): Promise<CoachingPayment[]> {
  const { data, error } = await supabase
    .from("coaching_payment")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Pagos recibidos por el coach (ingresos). */
export async function listCoachPayments(
  supabase: Client,
  coachId: string,
  filters: { status?: PaymentStatus } = {}
): Promise<CoachingPayment[]> {
  let query = supabase
    .from("coaching_payment")
    .select("*")
    .eq("coach_id", coachId)

  if (filters.status) query = query.eq("status", filters.status)

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Resumen de ingresos del coach (totales aprobados). */
export type CoachEarnings = {
  grossCents: number
  netCents: number
  commissionCents: number
  approvedCount: number
}

export async function getCoachEarnings(
  supabase: Client,
  coachId: string
): Promise<CoachEarnings> {
  const { data, error } = await supabase
    .from("coaching_payment")
    .select("amount_cents, net_cents, commission_cents")
    .eq("coach_id", coachId)
    .eq("status", "approved")
  if (error) throw error

  const rows = data ?? []
  return rows.reduce<CoachEarnings>(
    (acc, row) => ({
      grossCents: acc.grossCents + row.amount_cents,
      netCents: acc.netCents + row.net_cents,
      commissionCents: acc.commissionCents + row.commission_cents,
      approvedCount: acc.approvedCount + 1,
    }),
    { grossCents: 0, netCents: 0, commissionCents: 0, approvedCount: 0 }
  )
}

// =============================================================================
// REVIEWS
// =============================================================================

/** Reseñas de un programa. */
export async function listProgramReviews(
  supabase: Client,
  programId: string
): Promise<CoachingReview[]> {
  const { data, error } = await supabase
    .from("coaching_review")
    .select("*")
    .eq("program_id", programId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Reseña existente para una suscripción (para evitar duplicados). */
export async function getSubscriptionReview(
  supabase: Client,
  subscriptionId: string
): Promise<CoachingReview | null> {
  const { data, error } = await supabase
    .from("coaching_review")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Crea una reseña. El trigger recalcula el rating del coach. */
export async function createReview(
  supabase: Client,
  input: CoachingReviewInsert
): Promise<string> {
  const { data, error } = await supabase
    .from("coaching_review")
    .insert(input)
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

