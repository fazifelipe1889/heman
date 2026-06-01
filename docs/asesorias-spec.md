# EPHA · Sistema de Asesorías (Coaching Marketplace)

> **Documento de especificación de producto y arquitectura.**
> Estado: propuesta / diseño. No implementado.
> Última actualización: 2026-05-31.
> Este es el módulo que **diferencia a EPHA** del resto de apps fitness: convierte la app
> en la infraestructura de negocio de los coaches, no en un competidor de su contenido.

---

## 0. Tesis de producto

**El problema real.** Hoy un coach/influencer que vende asesorías opera con un *stack* fragmentado y artesanal:

- Venta y cobro → link de pago suelto (MercadoPago/transferencia) o DM.
- Entrega del plan → PDF, Excel, Google Sheet o notas de voz por WhatsApp.
- Seguimiento → capturas de pantalla, audios, "mandame foto del progreso".
- Comunicación → WhatsApp personal, que mezcla 80 clientes con la familia.

Esto **no escala, no retiene y no se ve profesional.** El coach pierde tiempo en logística
en vez de en coaching, y el cliente vive una experiencia desordenada.

**La solución EPHA.** Un único lugar donde el coach arma su **catálogo de asesorías**, vende con
un **link propio**, y al comprar **se auto-configura toda la experiencia del cliente** dentro de la
misma app que ya usa para entrenar: rutina cargada, suplementación cargada, chat habilitado y
progreso compartido. El coach gestiona a todos sus clientes desde un panel; el cliente entrena en
una sola app.

**Por qué es defendible (moat).**

1. **Integración vertical**: el plan no es un PDF, es *estado vivo* dentro del HUD de
   entrenamiento que EPHA ya tiene (ejecución en vivo, series, RIR, descanso, progreso/e1RM).
   Ningún Linktree/Hotmart puede ofrecer eso.
2. **Datos de adherencia reales**: el coach ve si el cliente entrenó, qué cargó, su volumen y
   e1RM por músculo — no "lo que el cliente dice que hizo".
3. **Efecto red de dos lados**: cada coach trae a sus seguidores a EPHA; cada usuario nuevo
   descubre más coaches en el marketplace.

**Principio rector de diseño.** *El coach es el cliente que paga; el usuario final es a quien
enamoramos.* Las decisiones de UX priorizan la fricción cero del usuario al comprar/usar, y la
productividad/profesionalismo del coach al gestionar.

---

## 1. Glosario y modelo conceptual

| Término | Definición |
|---|---|
| **Coach** | Usuario con permiso para crear y vender asesorías. |
| **Asesoría** (`coaching_program`) | La oferta/landing de un coach. Contiene 1..N planes. Ej: *"Transformación 12 semanas"*. |
| **Plan** (`coaching_plan`) | El producto comprable concreto: precio, duración y *qué incluye*. Ej: *Base / Premium / VIP*. |
| **Suscripción** (`coaching_subscription`) | El vínculo activo entre un usuario y un plan comprado. Es el centro de todo lo del cliente. |
| **Template** | Rutina/suplementación "molde" del coach que se **copia** (snapshot) al cliente al comprar. |
| **Provisioning** | El acto automático de configurar al cliente al confirmarse el pago. |
| **Marketplace** | El catálogo público navegable de asesorías. |

**Relación de cardinalidad:**

```
coach (profiles.is_coach) 1───N coaching_program 1───N coaching_plan 1───N coaching_subscription N───1 usuario
                                       │                      │                      │
                                       │                      │ (al comprar copia)   ├─ rutina snapshot (routines)
                                       │                      ├─ routine_template ───┤
                                       │                      └─ supplement_template ┴─ suplementos snapshot (supplements)
                                       │
                                       └─ coaching_subscription 1───1 chat_thread 1───N chat_message
```

---

## 2. Roles, identidad y permisos (RBAC)

### 2.1 Decisión de modelado de rol

EPHA hoy tiene `profiles` (1:1 con `auth.users`, PK = `auth.uid()`) **sin** concepto de rol. Se
propone el modelo más simple que escala: **un flag + una tabla de extensión.**

- `profiles.role` → enum `app_role`: `'user' | 'coach' | 'admin'`.
  - Razón: la mayoría de chequeos son binarios (¿puede vender?). Un enum es suficiente y barato de
    indexar. No se introduce un sistema RBAC completo (overkill para el MVP).
- `coach_profiles` (tabla 1:1 opcional) → datos públicos/comerciales del coach que **no** ensucian
  `profiles`: bio, handle único, redes, foto de portada, estado de verificación, datos de payout.

> **Nota de seguridad crítica.** `profiles.role` **nunca** debe ser editable por el propio usuario
> vía RLS de update. La promoción a `coach` ocurre por: (a) un flujo de "Convertite en coach" que
> dispara una *Edge Function* con `service_role`, o (b) aprobación de admin. La policy de UPDATE de
> `profiles` debe excluir explícitamente la columna `role` (o usar una columna en tabla aparte con
> RLS solo-lectura para el dueño y escritura solo `service_role`).

### 2.2 Matriz de permisos

| Acción | user | coach (dueño) | coach (ajeno) | admin |
|---|:---:|:---:|:---:|:---:|
| Ver marketplace público | ✅ | ✅ | ✅ | ✅ |
| Comprar un plan | ✅ | ✅ | ✅ | ✅ |
| Crear/editar/publicar asesoría | ❌ | ✅ | ❌ | ✅ |
| Ver lista de *mis* clientes | ❌ | ✅ | ❌ | ✅ |
| Ver rutina/progreso de un cliente | ❌ | ✅ (si suscripción activa y plan lo permite) | ❌ | ✅ |
| Enviar mensaje en un thread | ✅ (su thread) | ✅ (sus threads) | ❌ | 👀 (solo lectura/moderación) |
| Configurar payout / ver ingresos | ❌ | ✅ (solo lo propio) | ❌ | ✅ |
| Moderar/suspender coach | ❌ | ❌ | ❌ | ✅ |

### 2.3 Estrategia RLS (alineada a EPHA: "RLS por dueño vía EXISTS en hijas")

- **`coaching_program`, `coaching_plan`**: SELECT público solo si `status = 'published'`; ALL para
  el dueño (`coach_id = auth.uid()`).
- **`coaching_subscription`**: SELECT/visible para `user_id = auth.uid()` **o** `coach_id = auth.uid()`.
  INSERT/UPDATE solo vía `service_role` (las crea el provisioning, no el cliente directamente).
- **`chat_message`**: política `EXISTS (SELECT 1 FROM coaching_subscription s WHERE s.id = subscription_id
  AND (s.user_id = auth.uid() OR s.coach_id = auth.uid()) AND s.status = 'active')`. Esto **gatea el
  chat por suscripción activa** a nivel base de datos — no se confía solo en la UI.
- **Templates del coach** (`coach_routine_template`, etc.): ALL solo dueño.

---

## 3. Modelo de datos (esquema completo)

> Convenciones EPHA: snake_case, `id uuid default gen_random_uuid()`, timestamps `created_at/updated_at`,
> RLS por `auth.uid()`, tipos a mano en `src/lib/supabase/types.ts`, dominio puro en `src/lib/domain`,
> acceso solo vía `src/lib/db`. Migraciones nuevas: `0011_coaching_core.sql` … `0014_coaching_payments.sql`.

### 3.1 `coach_profiles` — identidad comercial del coach

```sql
create table coach_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  handle          text unique not null,          -- slug público: /c/nacho-fit
  display_name    text not null,
  headline        text,                           -- "Coach de fuerza · IFBB"
  bio             text,
  avatar_url      text,
  cover_url       text,
  socials         jsonb default '{}',             -- { instagram, tiktok, youtube, web }
  is_verified     boolean default false,          -- badge adicional sobre el curado (fase posterior)
  status          text default 'pending_review',  -- pending_review | active | suspended | rejected (curado por admin, §14.1)
  -- comercial
  commission_pct  numeric default 15,             -- 15% fija en F1/F2 (§14.1); columna lista por si se negocia luego
  payout_provider text,                           -- 'mercadopago' | 'stripe_connect'
  payout_ref      jsonb default '{}',             -- ids de cuenta conectada (nunca secrets crudos)
  -- métricas denormalizadas (para el marketplace, actualizadas por trigger/cron)
  rating_avg      numeric default 0,
  rating_count    int default 0,
  active_clients  int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### 3.2 `coaching_program` — la asesoría / landing

```sql
create table coaching_program (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references coach_profiles(id) on delete cascade,
  slug             text not null,                 -- /c/nacho-fit/transformacion-12s
  title            text not null,
  tagline          text,                          -- gancho corto
  description      text,                          -- markdown
  category         text not null,                 -- 'musculacion' | 'recomposicion' | 'fuerza' | 'perdida_grasa' | 'cardio' | 'mixto'
  cover_url        text,
  intro_video_url  text,                          -- YouTube/embed
  level            text,                          -- 'Principiante' | 'Intermedio' | 'Avanzado'
  -- qué incluye (a nivel programa, marketing)
  includes         jsonb default '{}',            -- { rutinas, suplementacion, chat, progreso, videollamadas, dieta }
  faq              jsonb default '[]',            -- [{ q, a }]
  status           text default 'draft',          -- draft | published | archived
  position         int default 0,                 -- orden en el perfil del coach
  published_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (coach_id, slug)
);
```

### 3.3 `coaching_plan` — el producto comprable (tier)

```sql
create table coaching_plan (
  id                     uuid primary key default gen_random_uuid(),
  program_id             uuid not null references coaching_program(id) on delete cascade,
  coach_id               uuid not null references coach_profiles(id),  -- denormalizado p/ RLS
  name                   text not null,           -- "Premium"
  description            text,
  -- precio y duración
  price_cents            int not null,            -- en centavos para evitar floats
  currency               text default 'ARS',
  billing_type           text default 'one_time', -- F1: solo 'one_time' (§14.1); 'recurring' habilitado en F3
  recurring_interval     text,                    -- 'month' (deshabilitado hasta F3)
  duration_days          int not null,            -- acceso: 30/90/180
  -- qué desbloquea este plan (gating real)
  perks                  jsonb default '{}',      -- ver §3.3.1
  -- provisioning automático
  routine_template_id    uuid references coach_routine_template(id),
  supplement_template_id uuid references coach_supplement_template(id),
  -- estado
  is_visible             boolean default true,
  position               int default 0,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);
```

#### 3.3.1 Estructura de `perks` (contrato del plan — fuente de verdad del gating)

```jsonc
{
  "chat": { "enabled": true, "sla_hours": 24, "monthly_message_cap": null }, // null = ilimitado
  "video_calls": { "count": 1, "minutes": 45 },                              // por período
  "routine": { "enabled": true, "reconfigs_included": 1 },                   // reajustes de rutina
  "supplements": { "enabled": true },
  "progress_sharing": { "enabled": true },                                   // coach ve métricas del cliente
  "diet_plan": { "enabled": false }
}
```

> **Por qué JSONB y no columnas.** Los perks van a evolucionar rápido (es donde el coach
> experimenta su oferta). JSONB evita migraciones por cada nuevo beneficio. El **dominio** valida la
> forma con Zod (`src/lib/domain/coaching.ts`) — única fuente de verdad del contrato.

### 3.4 `coaching_subscription` — el corazón del cliente

```sql
create table coaching_subscription (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id),
  plan_id             uuid not null references coaching_plan(id),
  program_id          uuid not null references coaching_program(id),  -- denormalizado
  coach_id            uuid not null references coach_profiles(id),    -- denormalizado p/ RLS y queries
  -- ciclo de vida
  status              text not null default 'pending', -- pending | active | paused | expired | cancelled | refunded
  starts_at           timestamptz,
  ends_at             timestamptz,
  -- snapshot de lo provisto (qué se le copió al comprar)
  perks_snapshot      jsonb not null,             -- copia de plan.perks al momento de compra (inmutable)
  routine_id          uuid references routines(id),    -- la rutina COPIADA del template
  -- contadores de consumo
  messages_used       int default 0,
  video_calls_used    int default 0,
  reconfigs_used      int default 0,
  -- coach
  coach_notes         text,                       -- privadas del coach sobre el cliente
  -- pago (resumen; detalle en coaching_payment)
  last_payment_id     uuid,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index on coaching_subscription (coach_id, status);
create index on coaching_subscription (user_id, status);
```

> **`perks_snapshot` y `routine_id` son el truco clave.** Garantizan que lo que el cliente compró
> no cambie si el coach luego edita el plan o el template. Ver §5 (motor de provisioning).

### 3.5 Templates del coach (moldes reutilizables)

```sql
create table coach_routine_template (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coach_profiles(id) on delete cascade,
  name        text not null,
  description text,
  -- estructura idéntica a una rutina EPHA, serializada (reusa el dominio de routines)
  payload     jsonb not null,   -- { type, days/exercises, sets, target_reps, rir, tempo, rest... }
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table coach_supplement_template (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coach_profiles(id) on delete cascade,
  name        text not null,
  description text,
  items       jsonb not null,   -- [{ name, dose, days_of_week, times_of_day, notes, color }]
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

> Reutilizan **exactamente** la forma de `routines/routine_exercises` y `supplements` que EPHA ya
> tiene. El template es "una rutina sin dueño usuario, en formato serializado". El provisioning lo
> *deserializa* en tablas reales del cliente.

### 3.6 Chat

```sql
create table coaching_thread (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null unique references coaching_subscription(id) on delete cascade,
  coach_id         uuid not null references coach_profiles(id),
  user_id          uuid not null references auth.users(id),
  last_message_at  timestamptz,
  coach_unread     int default 0,
  user_unread      int default 0,
  created_at       timestamptz default now()
);

create table coaching_message (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references coaching_subscription(id) on delete cascade,
  sender_id        uuid not null references auth.users(id),
  sender_role      text not null,    -- 'coach' | 'user'
  body             text,
  attachment_url   text,             -- Supabase Storage (foto/video/pdf)
  attachment_type  text,             -- 'image' | 'video' | 'file'
  read_at          timestamptz,
  created_at       timestamptz default now()
);
create index on coaching_message (subscription_id, created_at);
```

### 3.7 Pagos y reseñas

```sql
create table coaching_payment (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid references coaching_subscription(id),
  user_id           uuid not null,
  coach_id          uuid not null,
  provider          text not null,         -- 'mercadopago' | 'stripe'
  provider_ref      text not null,         -- payment_id externo (idempotencia)
  amount_cents      int not null,
  currency          text not null,
  commission_cents  int not null,          -- lo que retiene EPHA
  net_cents         int not null,          -- lo que va al coach
  status            text not null,         -- pending | approved | rejected | refunded | charged_back
  raw_event         jsonb,                 -- payload del webhook (auditoría)
  created_at        timestamptz default now(),
  unique (provider, provider_ref)          -- idempotencia de webhooks
);

create table coaching_review (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null unique references coaching_subscription(id),
  program_id       uuid not null references coaching_program(id),
  coach_id         uuid not null references coach_profiles(id),
  user_id          uuid not null,
  rating           int not null check (rating between 1 and 5),
  comment          text,
  created_at       timestamptz default now()
);
```

---

## 4. El motor de provisioning (el diferenciador técnico)

Cuando un pago se confirma, EPHA **arma automáticamente** la experiencia del cliente. Esto es lo que
ninguna landing/Hotmart puede hacer.

### 4.1 Secuencia (atómica, idempotente, server-side)

```
Webhook de pago APPROVED
  │  (Edge Function con service_role — nunca desde el cliente)
  ▼
1. Idempotencia: ¿existe coaching_payment con (provider, provider_ref)?  → si sí, salir.
2. Insertar coaching_payment (calcular commission/net con coach.commission_pct).
3. Resolver plan + templates.
4. coaching_subscription:
     - status = 'active'
     - starts_at = now(); ends_at = now() + plan.duration_days
     - perks_snapshot = COPIA INMUTABLE de plan.perks
5. PROVISIONAR RUTINA (si perks.routine.enabled):
     - deserializar routine_template.payload → INSERT en routines + routine_exercises del user_id
     - guardar subscription.routine_id
     - (opcional) asignar al plan semanal activo del usuario
6. PROVISIONAR SUPLEMENTACIÓN (si perks.supplements.enabled):
     - por cada item del template → INSERT en supplements del user_id
7. CHAT (si perks.chat.enabled): crear coaching_thread.
8. Notificar: email + push al usuario ("tu plan está listo") y al coach ("nuevo cliente").
9. Recalcular coach_profiles.active_clients.
   Todo dentro de una transacción; si algo falla → rollback y marcar payment para reintento.
```

### 4.2 Snapshot vs. referencia (regla de oro)

- **Snapshot (copiar):** rutina y suplementación del cliente, y `perks_snapshot`.
  → Si el coach edita su template mañana, **el cliente de hoy no se ve afectado** (no le cambiamos
  el plan bajo los pies). Justo, predecible, evita disputas.
- **Referencia (FK viva):** `program_id`, `plan_id`, `coach_id` (para trazabilidad e ingresos).

### 4.3 Reconfiguración (cuando el coach SÍ quiere actualizar al cliente)

Acción explícita del coach desde el panel del cliente: *"Actualizar rutina"*. Consume
`reconfigs_used` contra `perks.routine.reconfigs_included`. Permite:
- empujar un nuevo snapshot de template, **o**
- editar la rutina del cliente directamente (el coach tiene permiso de escritura sobre `routine_id`
  de esa suscripción, gateado por RLS).

---

## 5. Flujos de usuario (detallados)

### 5.1 Coach onboarding → "Convertite en coach"

```
1. Usuario va a Perfil → "Vender asesorías en EPHA".
2. Form de SOLICITUD: handle único, display_name, bio, foto, redes, (track record/links).
3. Acepta términos de coach (comisión 15%, responsabilidad del contenido, disclaimer médico).
4. Crea coaching_subscription... NO: crea coach_profiles con status='pending_review'.
     → profiles.role sigue siendo 'user'. NO puede publicar todavía.
5. ── CURADO POR ADMIN (§14.1) ──
     Admin revisa la cola de solicitudes → Aprobar / Rechazar.
     Al aprobar (Edge Function service_role): coach_profiles.status='active' + profiles.role='coach'.
     Se notifica al coach por email/push.
6. Coach aprobado aterriza en el Panel de Coach (con checklist de activación):
     [ ] Crear tu primera asesoría
     [ ] Crear al menos un plan
     [ ] Conectar cobros (MercadoPago — split en origen)
     [ ] Publicar
```

### 5.2 Construcción del catálogo

```
Panel Coach → "Nueva asesoría"
  → datos + portada/video + categoría + qué incluye (marketing)  → status: draft
  → dentro de la asesoría, "Agregar plan":
       nombre, precio, duración, perks (toggles claros: chat+SLA, videollamadas, reconfigs…)
       elegir routine_template + supplement_template (o "crear nuevo template" inline)
  → preview de la landing pública (tal cual la verá el cliente)
  → Publicar → genera link + QR compartibles
```

> **UX clave:** el coach edita perks con **toggles y selectores**, nunca JSON. El dominio traduce a
> `perks` JSONB. Cada toggle muestra en lenguaje natural qué desbloquea ("Chat con respuesta en 24h").

### 5.3 Compra (usuario) — fricción mínima

```
1. Usuario abre el link del coach (desde IG/TikTok/WhatsApp) → landing pública (sin login).
2. Compara planes (cards) → elige uno → "Comprar".
3. Si no tiene cuenta → registro express (email) inline, vuelve al checkout (deep link preservado).
4. Checkout (MercadoPago) → paga.
5. Webhook APPROVED → provisioning (§4) → redirect a "¡Listo!".
6. Dashboard del usuario ahora muestra el bloque "Mi Asesoría" + rutina + suplementos + chat.
```

### 5.4 Chat (gateado por plan, en tiempo real)

```
- Habilitado solo si perks_snapshot.chat.enabled y subscription.status='active' (RLS + UI).
- Realtime vía Supabase (subscripción a coaching_message por subscription_id).
- SLA visible para el coach: "Pendiente hace 18h / límite 24h" (ordena su bandeja por urgencia).
- Cap de mensajes (si aplica): el dominio bloquea el input al alcanzar monthly_message_cap.
- Adjuntos a Supabase Storage (bucket privado, signed URLs, límite 10MB, MIME allowlist).
- Al expirar la suscripción → chat pasa a solo-lectura (historial preservado).
```

### 5.5 Ciclo de vida de la suscripción

```
pending ──pago──▶ active ──(ends_at)──▶ expired ──(renueva)──▶ active
   │                 │
   │                 ├─ pause (coach/admin, ej. lesión) ──▶ paused ──▶ active (extiende ends_at)
   │                 └─ cancel (usuario) ──▶ cancelled (+ refund prorrateado, §9)
   └─ pago rechazado ─▶ (queda pending; se limpia por cron a las 24h)
```

**Renovación:** a falta de `recurring`, a los `ends_at - 7d` se notifica y se ofrece "Renovar"
(nueva compra que extiende `ends_at`). Si el plan es `recurring`, MercadoPago/Stripe cobra solo y el
webhook extiende.

---

## 6. Monetización y pagos

### 6.1 Proveedor

- **Primario: MercadoPago** (precios en ARS, mercado argentino, Checkout Pro + split de comisión
  vía *Marketplace/Application fee*). Es el camino de menor fricción local.
- **Secundario (fase posterior): Stripe Connect** para coaches/clientes internacionales (USD).

### 6.2 Modelo de comisión

- EPHA retiene `coach_profiles.commission_pct` (default 15%, negociable). Se calcula y guarda en
  `coaching_payment.commission_cents` / `net_cents`.
- **Split en origen** (preferido): el proveedor liquida directo al coach su neto y a EPHA su
  comisión (Marketplace de MP / `application_fee` de Stripe). Evita que EPHA sea custodio de fondos
  (menos riesgo regulatorio).

### 6.3 Webhooks (robustez)

- **Idempotencia** por `unique (provider, provider_ref)`.
- Verificación de firma del proveedor.
- Manejo de estados: `approved`, `rejected`, `refunded`, `charged_back` (este último → suspende
  suscripción y marca al usuario).
- Reintentos: cola/cron para eventos fallidos en provisioning.

### 6.4 Payouts e ingresos del coach

- Panel "Ingresos": historial, neto por período, comprobantes descargables, estado de liquidación.
- Si se usa split en origen, EPHA solo **refleja** (la transferencia la hace el proveedor).

---

## 7. Marketplace público y deep-linking

### 7.1 Rutas (App Router, públicas y SEO-ables)

```
/coaches                         → catálogo navegable (filtros: categoría, precio, duración, rating)
/c/[handle]                      → perfil del coach (bio, asesorías, rating, social proof)
/c/[handle]/[program-slug]       → landing de la asesoría (HERO + planes + testimonios + FAQ)  ← el link que se comparte
/c/[handle]/[program-slug]/checkout?plan=[id]
```

### 7.2 Requisitos

- **SEO/share:** SSR + `generateMetadata` con Open Graph dinámico (imagen de portada, título,
  precio "desde $X") para que el link se vea premium en IG/WhatsApp/X.
- **Deep-link con sesión preservada:** si el usuario no está logueado, registro inline que vuelve al
  checkout exacto. Cero rebotes.
- **QR generado** para historias/flyers.
- **Atribución:** parámetro `?ref=` para tracking de campañas del coach (opcional, fase 2).

---

## 8. Arquitectura de información (dashboards)

### 8.1 Panel del Coach (`/coach`)

```
Resumen        → KPIs: clientes activos, ingresos del mes, mensajes pendientes (SLA), rating.
Mis Asesorías  → grid de programas (draft/published/archived) · editar · stats · compartir link.
Clientes       → tabla/cards: nombre · plan · días restantes · adherencia (entrenó X/Y) ·
                 badges (mensaje sin leer, vence pronto) · → ficha del cliente.
   Ficha cliente→ chat · rutina (ver/editar/reconfig) · suplementación · progreso (e1RM/volumen
                 por músculo, si perks.progress_sharing) · notas privadas.
Bandeja (Chat) → todos los threads ordenados por urgencia SLA.
Ingresos       → historial, neto, comprobantes, liquidaciones.
Templates      → biblioteca de rutinas/suplementación reutilizables.
```

### 8.2 Dashboard del Usuario (bloque nuevo "Mi Asesoría")

```
Con suscripción activa:
  Card por suscripción → coach (foto/nombre) · plan · countdown de días · CTAs:
     [Chat]  [Ver mi rutina]  [Mis suplementos]  [Renovar] (si vence < 7d)
Sin suscripción:
  Estado vacío → "Encontrá tu coach" → /coaches
```

> La rutina/suplementación provistas aparecen **integradas** en los módulos existentes (Entrenar,
> Suplementación), con una etiqueta "Asignado por [Coach]". No es una sección aislada — vive donde el
> usuario ya entrena. *Ese es el punto.*

---

## 9. Seguridad, cumplimiento y casos de borde

| Tema | Decisión |
|---|---|
| **Promoción de rol** | `profiles.role` solo escribible por `service_role`/admin. Nunca por el usuario. |
| **Gating del chat** | A nivel **RLS** (suscripción activa + perk), no solo UI. |
| **Snapshot inmutable** | Editar template no afecta clientes existentes (§4.2). |
| **Reembolsos** | Cancelación temprana → reembolso prorrateado por días no usados; `status='refunded'`; revoca acceso (rutina queda solo-lectura). Política configurable por coach (con mínimos de plataforma). |
| **Chargeback** | Suspende suscripción, marca usuario, alerta a admin. |
| **Verificación de coach** | MVP: cualquiera puede ser coach pero sin badge; mostrar señales de confianza (rating, nº clientes). Fase 2: verificación con ID/track record → `is_verified`. |
| **Responsabilidad del contenido** | Disclaimer médico obligatorio; el coach acepta TyC de responsabilidad. EPHA es plataforma, no prescribe. |
| **Privacidad de datos del cliente** | El coach ve progreso **solo** si `perks.progress_sharing` y suscripción activa. Al expirar, pierde acceso a métricas nuevas. |
| **Adjuntos** | Bucket privado, signed URLs, allowlist MIME, límite de tamaño, escaneo básico. |
| **Anti-fuga (bypass)** | TyC prohíben mover el cobro fuera de EPHA; el valor (integración + datos) desincentiva el bypass mejor que la prohibición. |
| **Duplicados** | Constraint/validación: no permitir 2 suscripciones `active` del mismo `user_id`+`plan_id`. |
| **Datos sensibles de payout** | Nunca guardar secrets crudos; solo refs de cuenta conectada del proveedor. |

---

## 10. Realtime y notificaciones

- **Chat:** Supabase Realtime (postgres_changes sobre `coaching_message` filtrado por
  `subscription_id`). Indicadores de "leído" vía `read_at`.
- **Push** (web push primero; nativo al migrar): nuevo mensaje, plan provisto, vencimiento próximo,
  nuevo cliente (coach).
- **Email** (Resend/Supabase): bienvenida con plan listo, recibo de pago, recordatorio de
  vencimiento, "tu coach te respondió" (si no leyó en X horas).

---

## 11. Analítica y KPIs

**Plataforma:** GMV, take-rate, coaches activos, conversión landing→compra, retención/renovación,
LTV por coach.
**Coach:** ingresos, clientes activos, adherencia media de clientes (entrenamientos completados),
tiempo de respuesta vs SLA, rating, churn.
**Usuario:** adherencia, progreso (e1RM/volumen), satisfacción (review).

> La **adherencia** es métrica estrella y exclusiva de EPHA: nace de los datos reales del HUD de
> entrenamiento. Es el argumento de venta para retener coaches ("acá ves quién entrena de verdad").

---

## 12. Roadmap por fases (mapeado a migraciones EPHA)

| Fase | Alcance | Migraciones | Entregable |
|---|---|---|---|
| **F1 · Núcleo (MVP vendible)** | Rol coach, `coach_profiles`, programas+planes CRUD, templates, suscripción + **provisioning**, landing pública + checkout MercadoPago, dashboards mínimos. | `0011_coaching_core`, `0012_coaching_payments` | Un coach puede vender y el cliente recibe todo auto-configurado. |
| **F2 · Relación** | Chat realtime gateado, SLA, notificaciones, reseñas, vista de progreso del cliente para el coach, reconfiguración. | `0013_coaching_chat`, `0014_coaching_reviews` | Coaching continuo y retención. |
| **F3 · Escala** | Marketplace con filtros/ranking, verificación de coaches, analytics de coach, suscripción recurrente, videollamadas, atribución de campañas. | `0015_coaching_marketplace` | Crecimiento de dos lados + monetización avanzada. |
| **F4 · Internacional/Pro** | Stripe Connect (USD), payouts avanzados, programa de afiliados, planes con dieta/macros. | — | Expansión. |

---

## 13. Estructura de código propuesta (alineada a EPHA)

```
src/lib/domain/coaching.ts          → tipos puros + Zod de perks/templates + reglas (gating, prorrateo)
src/lib/db/coaching.ts              → única puerta Supabase (programas, planes, subs, mensajes)
src/lib/db/coaching-provisioning.ts → motor de snapshot (server-only)
src/features/coach/                 → UI del panel coach (asesorías, clientes, ingresos, templates)
src/features/coaching/              → UI del lado usuario (Mi Asesoría, chat)
src/features/marketplace/           → landing pública, cards, checkout
src/app/(app)/coach/...             → rutas privadas del coach
src/app/(app)/coaching/...          → rutas privadas del usuario (chat, mi asesoría)
src/app/(public)/c/[handle]/...     → marketplace público (SSR + OG)
supabase/functions/coaching-webhook → Edge Function de webhooks de pago (service_role)
```

> Respeta la regla EPHA: **ningún componente llama a Supabase directo**; el dominio es puro y
> framework-agnóstico (listo para la migración a nativo).

---

## 14. Decisiones de producto

### 14.1 Decisiones fijadas (2026-05-31)

1. **Comisión: 15% fija para todos los coaches.** `coach_profiles.commission_pct` existe igual (por
   si en el futuro se negocia), pero el default y el valor único en F1/F2 es `15`. No se expone UI de
   negociación todavía.
2. **Custodia: split en origen.** MercadoPago liquida directo el neto al coach y la comisión a EPHA
   (Marketplace/`application_fee`). **EPHA nunca es custodio de fondos.** `coaching_payment` solo
   *refleja* el resultado del split; el panel de ingresos del coach es read-only sobre eso.
3. **Acceso de coach: curado por admin.** Cualquiera puede *solicitar* ser coach, pero **no puede
   publicar** hasta ser aprobado. Implica:
   - `coach_profiles.status` arranca en `'pending_review'` (nuevo valor: `pending_review | active | suspended | rejected`).
   - `profiles.role` se setea a `'coach'` **solo al aprobar** (Edge Function/admin con `service_role`).
   - RLS de `coaching_program`: el INSERT/publicar exige `coach_profiles.status = 'active'`.
   - Se necesita una **vista de admin** mínima en F1: cola de solicitudes → aprobar/rechazar.
   - El badge `is_verified` queda como capa *adicional* sobre el curado (verificación de identidad/track
     record en fase posterior).
4. **Facturación F1: pago único por período.** `coaching_plan.billing_type = 'one_time'` exclusivamente.
   `recurring`/`recurring_interval` quedan en el esquema pero **deshabilitados en UI y checkout** hasta F3.
   Renovación = nueva compra que extiende `ends_at` (flujo de §5.5).

### 14.2 Decisiones diferidas (2026-05-31)

5. **Dieta/macros → FUERA DE ALCANCE del coaching.** Decisión: no se construye módulo de dieta dentro
   de las asesorías. Razón: es un producto entero (food tracker estilo MyFitnessPal) y meterlo a medias
   ensucia el MVP. **El plan nutricional se entrega vía chat con adjuntos** (F2) — que ya cubre el caso
   sin construir nada. Si aparece demanda real, se evaluará como **módulo independiente** (empezando por
   "macros objetivo": kcal + P/C/G por día), nunca acoplado a la arquitectura de coaching.

6. **Reembolsos → política manual, sin automatizar (esquema ya listo).** Como el cobro es pago único
   con split en origen, MercadoPago maneja su propio flujo de devolución/contracargo; EPHA no custodia
   fondos. **Default de plataforma:** sin reembolso salvo incumplimiento del coach, gestionado caso por
   caso por admin (el admin dispara el refund vía API de MP → webhook marca `status='refunded'` y revoca
   acceso). El esquema (`coaching_payment.status='refunded'`, manejo en webhook §6.3) ya lo soporta; solo
   se difiere la *política/automatización* (prorrateo, ventana de X días) hasta tener volumen real.
```