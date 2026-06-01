# SQL Setup — Sistema de Asesorías (Coaching)

## 📋 Orden de ejecución

Ejecuta **en este orden exacto** en Supabase (SQL Editor):

1. `supabase/migrations/0011_coaching_core.sql` — Tablas core + RLS
2. `supabase/migrations/0012_coaching_chat.sql` — Chat + RLS
3. `supabase/migrations/0013_coaching_payments.sql` — Pagos + funciones webhook
4. `supabase/migrations/0014_coaching_realtime.sql` — Realtime para el chat

## 🔑 Variable de entorno requerida (provisioning)

El provisioning de suscripciones y la moderación de coaches usan el cliente
**service_role** (bypassa RLS). Agregá a tu `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Supabase → Settings → API → service_role (secret)
```

⚠️ Es secreta: NO lleva prefijo `NEXT_PUBLIC` y nunca se expone al navegador.

## 🧑‍💼 Hacerte admin (para moderar coaches)

El panel `/admin/coaches` requiere `profiles.role = 'admin'`. Marcá tu usuario:

```sql
update profiles set role = 'admin' where id = '<tu-user-id>';
```

## 🔧 Procedimiento paso a paso

### 1. Abre Supabase Dashboard
Ve a tu proyecto → **SQL Editor** (izquierda).

### 2. Ejecuta `0011_coaching_core.sql`
- Copia todo el contenido de `0011_coaching_core.sql`
- Pégalo en una nueva query en SQL Editor
- Click **Run** (botón verde)
- Verifica que no haya errores (mirarás rojo si falla)

### 3. Ejecuta `0012_coaching_chat.sql`
- Igual que arriba con `0012_coaching_chat.sql`

### 4. Ejecuta `0013_coaching_payments.sql`
- Igual que arriba con `0013_coaching_payments.sql`

## ✅ Verificación rápida

Después de las 3 migraciones, en Supabase **Database** → **Tables**, deberías ver:

```
coach_profiles
coaching_program
coaching_plan
coach_routine_template
coach_supplement_template
coaching_subscription
coaching_thread
coaching_message
coaching_payment
coaching_review
```

## 🛠️ Troubleshooting

### Error: "role" column already exists
Si ves `column "role" of relation "profiles" already exists`:
- **Es normal** si ya habías agregado `role` a `profiles`. La migración usa `add column if not exists`, así que es idempotente.

### Error: "permission denied" o RLS issues
- Asegúrate de estar logueado como **propietario del proyecto** (rol admin en Supabase).
- Las migraciones usan `alter table ... enable row level security` (idempotente), así que es safe correr varias veces.

### Error: "coach_profiles" references "auth.users"
- Normal y esperado — significa que Supabase sabe que `auth.users` existe.

## 📝 Notas importantes

1. **RLS activado:** Todas las tablas del coaching tienen Row Level Security. Sin RLS, cualquiera podría ver/editar datos ajenos.
2. **Triggers automáticos:** Se crean funciones y triggers para:
   - Actualizar `updated_at` automáticamente
   - Calcular rating del coach al insertar/borrar reseña
   - Actualizar contador de mensajes sin leer
3. **Idempotencia:** Las migraciones pueden ejecutarse varias veces sin duplicar datos (usan `if not exists`, constraints únicos, etc.).

## 🔐 Verificación de RLS (avanzado)

Si querés ver que las políticas se aplican:

```sql
-- Ver todas las políticas RLS creadas
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'coaching%';
```

## 📞 Próximo paso

Una vez que las migraciones estén aplicadas:
1. Actualiza `src/lib/supabase/types.ts` con los nuevos tipos Zod.
2. Escribe `src/lib/db/coaching.ts` (data layer).
3. Escribe `src/lib/domain/coaching.ts` (tipos puros + validaciones).
4. Crea la Edge Function para webhooks de pago.

---

**Last tested:** 2026-05-31  
**Versión de Supabase:** PostgreSQL 15+
