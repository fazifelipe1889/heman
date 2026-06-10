/**
 * Helpers puros para derivar series temporales del panel del coach a partir de
 * pagos y suscripciones reales. Sin dependencias de React/Supabase: reciben
 * arrays planos y devuelven datos listos para Recharts.
 *
 * Tipado estructural a propósito (PaymentLike / SubLike) para no acoplar a los
 * tipos generados; `CoachingPayment` y `CoachingSubscription` son asignables.
 */

type PaymentLike = {
  status: string
  net_cents: number
  created_at: string
  program_id: string
}

type SubLike = { created_at: string }

const MS_WEEK = 7 * 24 * 60 * 60 * 1000

/** Inicio (lunes 00:00 local) de la semana de una fecha. */
function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const dow = (x.getDay() + 6) % 7 // lunes = 0
  x.setDate(x.getDate() - dow)
  return x
}

function dmLabel(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

/** Construye `weeks` buckets semanales contiguos (más viejo → más nuevo). */
function buildWeekBuckets(weeks: number): {
  buckets: { start: number; label: string }[]
  firstStart: number
} {
  const thisWeek = startOfWeek(new Date())
  const buckets: { start: number; label: string }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek)
    start.setDate(start.getDate() - i * 7)
    buckets.push({ start: start.getTime(), label: dmLabel(start) })
  }
  return { buckets, firstStart: buckets[0]?.start ?? thisWeek.getTime() }
}

function weekIndex(createdAt: string, firstStart: number): number {
  const wk = startOfWeek(new Date(createdAt)).getTime()
  return Math.floor((wk - firstStart) / MS_WEEK)
}

export type WeeklyRevenuePoint = { label: string; net: number }

/** Ingreso neto (centavos) por semana, pagos aprobados, últimas `weeks`. */
export function weeklyNetRevenue(
  payments: readonly PaymentLike[],
  weeks = 8,
): WeeklyRevenuePoint[] {
  const { buckets, firstStart } = buildWeekBuckets(weeks)
  const nets = new Array(buckets.length).fill(0)
  for (const p of payments) {
    if (p.status !== "approved") continue
    const i = weekIndex(p.created_at, firstStart)
    if (i >= 0 && i < nets.length) nets[i] += p.net_cents
  }
  return buckets.map((b, i) => ({ label: b.label, net: nets[i] }))
}

export type WeeklyClientsPoint = { label: string; nuevos: number }

/** Clientes nuevos por semana (alta de suscripción), últimas `weeks`. */
export function weeklyNewClients(
  subs: readonly SubLike[],
  weeks = 8,
): WeeklyClientsPoint[] {
  const { buckets, firstStart } = buildWeekBuckets(weeks)
  const counts = new Array(buckets.length).fill(0)
  for (const s of subs) {
    const i = weekIndex(s.created_at, firstStart)
    if (i >= 0 && i < counts.length) counts[i]++
  }
  return buckets.map((b, i) => ({ label: b.label, nuevos: counts[i] }))
}

export type ClientGrowthPoint = { label: string; total: number }

/** Total acumulado de clientes al cierre de cada semana, últimas `weeks`. */
export function cumulativeClients(
  subs: readonly SubLike[],
  weeks = 8,
): ClientGrowthPoint[] {
  const { buckets, firstStart } = buildWeekBuckets(weeks)
  const counts = new Array(buckets.length).fill(0)
  let baseline = 0
  for (const s of subs) {
    const i = weekIndex(s.created_at, firstStart)
    if (i < 0) baseline++
    else if (i < counts.length) counts[i]++
  }
  let running = baseline
  return buckets.map((b, i) => {
    running += counts[i]
    return { label: b.label, total: running }
  })
}

export type MonthlyRevenuePoint = { label: string; net: number }

/** Ingreso neto (centavos) por mes calendario, pagos aprobados, últimos `months`. */
export function monthlyNetRevenue(
  payments: readonly PaymentLike[],
  months = 6,
): MonthlyRevenuePoint[] {
  const now = new Date()
  const buckets: { key: string; label: string }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("es-AR", { month: "short" }),
    })
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]))
  const nets = new Array(buckets.length).fill(0)
  for (const p of payments) {
    if (p.status !== "approved") continue
    const d = new Date(p.created_at)
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (i !== undefined) nets[i] += p.net_cents
  }
  return buckets.map((b, i) => ({ label: b.label, net: nets[i] }))
}

/** Suscripciones dadas de alta en los últimos `days` días (conserva el tipo). */
export function clientsSince<T extends { created_at: string }>(
  subs: readonly T[],
  days: number,
): T[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return subs.filter((s) => new Date(s.created_at).getTime() >= cutoff)
}

export type ProductRevenueSlice = { name: string; value: number }

/** Ingreso neto (centavos) por producto, top `topN` + "Otros". */
export function revenueByProduct(
  payments: readonly PaymentLike[],
  titleById: Map<string, string>,
  topN = 5,
): ProductRevenueSlice[] {
  const agg = new Map<string, number>()
  for (const p of payments) {
    if (p.status !== "approved") continue
    agg.set(p.program_id, (agg.get(p.program_id) ?? 0) + p.net_cents)
  }
  const rows = [...agg.entries()]
    .map(([id, value]) => ({ name: titleById.get(id) ?? "Producto", value }))
    .sort((a, b) => b.value - a.value)
  if (rows.length <= topN) return rows
  const rest = rows.slice(topN).reduce((s, r) => s + r.value, 0)
  return [...rows.slice(0, topN), { name: "Otros", value: rest }]
}
