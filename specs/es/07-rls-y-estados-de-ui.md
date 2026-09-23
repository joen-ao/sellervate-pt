# 07 · RLS como defensa en profundidad + barrido de estados de UI
Ramas `feat/rls-defense` (07a) y `feat/ui-states` (07b) · Migración `0002_rls.sql` · Est. 35 + 25 min · Oleada 2 (07a) / 3 (07b)

## 1. Producto
Dos cosas baratas ahora y caras después: una segunda puerta de autorización dentro de Postgres, y un barrido para que cada pantalla tenga estados vacío/carga/error diseñados.

RLS existe para que un consumidor directo futuro de la base (ingester, job de reportes, un bug en el DAL) tampoco pueda cruzar marcas. El DAL sigue siendo la puerta primaria.

Salida de emergencia: si cablear RLS al request path pasa de 20 minutos, entregar policies + SQL de prueba, dejar el DAL sobre el cliente admin, y escribir en DECISIONS que RLS está definida y verificada pero no en el request path. Ítem a medias honesto.

## 2. Plan técnico — 07a RLS

### Mecanismo
Un setting de alcance de transacción `app.current_user_id` leído por una función stable. El DAL lo setea dentro de la misma transacción que el query, bajo un rol sin `bypassrls`. Un `SET` de sesión sobre una conexión del pool filtraría el usuario anterior — ese es el footgun que el brief está buscando.

### Migración `0002_rls.sql`
SQL completo en `07-rls-and-ui-states.md`. Contenido:
- Rol `app_user nologin` con grants de select/insert/update; `grant app_user to authenticated` para las pruebas.
- `current_app_user_id()` con `current_setting('app.current_user_id', true)` (missing-ok, evita el error 22P02), `current_app_role()`, `is_brand_member(uuid)`.
- Policies con `enable` + `force row level security` en `brands`, `brand_members`, `profiles` (select abierto para nombres), `replies` (miembros; specialists solo las propias), `reviews` (select delega en `replies`; insert solo leads miembros y `reviewer_id = yo`; update solo el specialist dueño, para el ack).
- `set_app_user(uuid)` que hace `set_config(…, true)`.
- Todo envuelto en `(select …)` para que el planner lo cachee por statement.

### Cableado al request path (`lib/supabase/rls.ts`)
PostgREST corre cada request en su propia transacción, así que `set_config(…, true)` no se puede compartir entre dos llamadas REST. Dos opciones; elegir una y documentarla:

**Opción A (elegida): conexión directa a Postgres para el DAL** con `postgres.js`. `asUser(userId, fn)` abre `sql.begin`, hace `set_config`, `set local role app_user`, y ejecuta `fn(tx)`. Las funciones del DAL conservan su firma; por dentro pasan de `admin.from(...)` a `asUser(u.id, tx => tx\`select …\`)` para lecturas. La migración agrega un rol login `app_login` miembro de `app_user`, documentado en README (`DATABASE_URL_APP`).

**Opción B: seguir con supabase-js y un RPC por lectura** que llama `set_app_user` primero y selecciona en el mismo cuerpo. Menos cableado, más SQL. Elegir B si A lleva más de 15 minutos atascada.

En cualquier caso, `admin` (service role) queda solo para seed, el lookup de perfil en `getCurrentUser()` y el switcher.

### Prueba (README + `scripts/rls-proof.sql`)
Dos transacciones con `set_app_user` + `set local role app_user` + conteos + `rollback`: como Dani, `replies` de Lume = 0 y `replies` de otros specialists = 0, `reviews` visibles = 6; como Marta, Lume = 0 y total = 17. Se corre con `psql "$DB_URL" -f scripts/rls-proof.sql`.

## 2. Plan técnico — 07b barrido de estados de UI
Por ruta (`/switch-needed`, `/queue`, `/reviews/[id]`, `/brands/[slug]`, `/me`):
- `loading.tsx` existe y el skeleton respeta las alturas reales.
- `error.tsx` existe con `ErrorCard` y `reset()`.
- Estado vacío con una frase real y una acción siguiente.
- Forbidden/not-found usan `StatePage`, no los defaults de Next (`experimental.authInterrupts`).
- Sin hex crudo en componentes: `grep -rn "#[0-9a-f]\{6\}" app components` → solo `DESIGN.md` y el theme.

### `DESIGN.md` (≤ 25 líneas) y theme daisyUI
Theme `sellervate-qa` (código en el spec en inglés): canvas casi negro y superficie elevada en oklch, un solo índigo como `primary` para acciones, `success` = score 4–5, `warning` = score 3 o `minor`, `error` = **solo crítico**. Inter vía `next/font`, escala 12/14/16/20/28, pesos 400/500/600. Regla: rojo = "esto puede costar la cuenta", en ningún otro lugar.

## 3. Verificar a mano
- `supabase db reset` dos veces (policies idempotentes).
- `psql -f scripts/rls-proof.sql` coincide con los conteos esperados.
- Romper el DAL a propósito (quitar `.eq('specialist_id', u.id)` en `/api/me/reviews` localmente) → RLS sigue devolviendo solo las filas de Dani. Restaurar. Mencionar el experimento en DECISIONS: eso es defensa en profundidad.
- Recorrer las cinco rutas como Marta, Nuria, Dani, Iker; screenshot de cada estado vacío para `docs/`.

## 4. Checklist de review
- ¿Algún `current_setting` sin missing-ok? ¿Alguna función fuera de subselect?
- ¿El seed sigue corriendo (service role bypassa RLS)?
- ¿El rol login no tiene `bypassrls`? (`select rolbypassrls from pg_roles where rolname='app_login'` → f)
- ¿El `set_config` está dentro de `begin … commit` y se usa `set local role`, nunca `set role`?
- ¿Algún color hex crudo en componentes?
