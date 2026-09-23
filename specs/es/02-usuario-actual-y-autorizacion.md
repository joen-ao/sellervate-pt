# 02 · Usuario actual y base de autorización
Rama `feat/current-user-dal` · Sin migración · Est. 45 min · Oleada 1 (sola; define los contratos de la oleada 2)

## 1. Producto
Fingir el login, nunca fingir quién ve qué.

> El servidor decide qué puede ver el usuario actual, a partir de un valor que el cliente no puede falsificar, antes de que salga cualquier fila de la base.

- Identidad: cookie httpOnly firmada con HMAC, seteada por el switcher. Una cookie plana sería "hardcodear lo que pueden ver" por la puerta de atrás.
- Autorización: `lib/data/*` es el único camino a la base. Toda función resuelve usuario, resuelve membresía, filtra en SQL.
- Los route handlers existen para que los evaluadores hagan curl; llaman al mismo DAL.
- Auth real: reemplazar `/switch` por Supabase Auth, `getCurrentUser()` lee `auth.getUser()`, RLS pasa a `auth.uid()`. DAL y modelo de membresía intactos.

## 2. Plan técnico

### Archivos (todos nuevos; son los contratos de la oleada 2)
```
.env.example                          # SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
lib/errors.ts                         # ForbiddenError(403), NotFoundError(404), ConflictError(409)
lib/current-user.ts                   # signUserId, getCurrentUser (cache), requireUser, requireRole
lib/supabase/admin.ts                 # ÚNICO cliente Supabase, con 'server-only'
lib/data/membership.ts                # getMemberBrandIds (cache), assertBrandMember, resolveMemberBrand
lib/data/_shared.ts                   # REPLY_COLUMNS, REVIEW_COLUMNS, PAGE_SIZE, hoursAgo
lib/page.ts                           # runPage: mapea ForbiddenError→forbidden(), NotFoundError→notFound()
app/switch/route.ts                   # POST form: valida uuid, existe en profiles, setea cookie, redirige por rol
components/UserSwitcher.tsx           # server component, <form method=post action=/switch>, sin JS
app/layout.tsx  app/page.tsx  app/switch-needed/page.tsx
app/forbidden.tsx  app/not-found.tsx  # StatePage compartido
app/api/_lib/respond.ts               # handle(fn): try/catch → JSON con e.status
app/api/brands/[slug]/replies/route.ts
scripts/print-cookies.ts              # imprime export MARTA=… DANI=…
```

### Código
Idéntico a `02-current-user-and-authorization.md`. Lo que importa entender de cada pieza:

- **`current-user.ts`**: `signUserId` = `${id}.${hmac_sha256(id, SECRET)}`. `verify` parte por el último punto, recalcula, compara con `timingSafeEqual` **verificando longitudes antes** (si no, `timingSafeEqual` lanza). `SESSION_SECRET` se valida con mínimo 32 caracteres al arrancar. `getCurrentUser` va envuelto en `cache()` de React para que layout + página + action cuesten un solo hit a la base.
- **`membership.ts`**: `resolveMemberBrand(userId, slug)` → 404 si el slug no existe, 403 si existe y no es miembro. Decisión: aceptamos revelar "esta marca existe" porque las marcas son la lista de clientes de Sellervate, no un secreto de los specialists. Va en DECISIONS.
- **`switch/route.ts`**: recibe `formData`, valida con zod, verifica que el perfil exista, redirige 303 a `/queue` o `/me` según rol, cookie `httpOnly, sameSite=lax, path=/`.
- **`api/brands/[slug]/replies`**: `requireUser` → `resolveMemberBrand` → query con `REPLY_COLUMNS`, `.eq('brand_id')`, y si es specialist además `.eq('specialist_id', u.id)` **en SQL**.
- **`forbidden()`** de Next requiere `experimental.authInterrupts: true` en `next.config.ts`.

## 3. Verificar a mano
```bash
eval "$(npm run -s print-cookies)"
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/voltaire/replies -H "Cookie: app_user=$DANI"   # 200
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/lume/replies     -H "Cookie: app_user=$DANI"   # 403
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/nope/replies     -H "Cookie: app_user=$DANI"   # 404
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/lume/replies     -H "Cookie: app_user=${DANI%.*}.deadbeef"  # 403
curl -s localhost:3000/api/brands/kraftco/replies -H "Cookie: app_user=$DANI" | jq '.replies[].specialist_id' | sort -u   # solo el id de Dani
grep -rn "service_role\|SERVICE_ROLE" --include=*.ts --include=*.tsx . | grep -v node_modules   # solo admin.ts + scripts
grep -rn "x-user\|userId=" app lib | grep -v switch/route.ts   # nada
```

## 4. Checklist de review
- ¿El agente leyó identidad de algo que no sea la cookie? ¿Algún `searchParams.userId`, header, o estado de "usuario actual" en cliente?
- ¿La comparación HMAC es en tiempo constante y con chequeo de longitud? ¿Se valida el largo de `SESSION_SECRET`?
- ¿`admin.ts` tiene `server-only`? ¿Algo bajo `components/` lo importa?
- ¿El filtro de specialist en la ruta es `.eq` en SQL y no un filtro después del fetch?
- ¿`getCurrentUser` está en `cache()`?
- ¿El orden 404 vs 403 coincide con la decisión?
