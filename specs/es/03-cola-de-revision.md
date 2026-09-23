# 03 · Cola de revisión
Rama `feat/review-queue` · Sin migración · Est. 45 min · Oleada 2

## 1. Producto
Marta abre la herramienta el lunes, ve lo que sus specialists enviaron ayer y se despacha cinco rápido. "Revisar siguiente" es el mecanismo de muestreo: el lead nunca tiene que elegir.

- Ruta `/queue`, solo team lead; specialists → `/me`.
- Ventana por defecto 48 h; filtros: marca (las suyas), estado (`unreviewed` por defecto | `reviewed` | `all`); `?page=`.
- Fila: tag de marca, specialist, tiempo relativo, primeros 120 caracteres del mensaje y de la respuesta, pill de estado (score + punto rojo si crítico, check si acknowledged).
- Contador "12 sin revisar · 2 marcas".
- Fuera: búsqueda, acciones en lote, asignación, navegación por teclado (solo si sobra tiempo al final).

## 2. Plan técnico

### Archivos
```
lib/data/replies.ts                      # listQueue(filter), nextUnreviewedReplyId(brandSlug?)
lib/format.ts                            # relativeTime(iso): "ayer 16:42" / "hoy 09:10" / "hace 3 días"
app/queue/page.tsx  loading.tsx  error.tsx
app/queue/_components/QueueFilters.tsx   # server component, links, sin estado
app/queue/_components/QueueRow.tsx
app/queue/_components/ReviewNextButton.tsx
components/{Pill,SeverityDot,EmptyState,ErrorCard,Skeleton}.tsx  (crear si no existen)
```

### DAL (`lib/data/replies.ts`)
Código en `03-review-queue.md`. Lo esencial:
- `listQueue({ brandSlug?, status, page, windowHours=48 })`: `requireRole('team_lead')` → `getMemberBrandIds` → si viene `brandSlug`, `resolveMemberBrand` (403/404 si está fuera de la membresía) → query con `.in('brand_id', brandIds)`, `.gte('sent_at', hoursAgo(48))`, orden `sent_at desc`, `.range` para paginar, join a `brands`, `profiles` (por la FK `replies_specialist_id_fkey`) y left join a `reviews`.
- El filtro de estado va **en SQL**: `.is('reviews', null)` / `.not('reviews','is',null)` sobre el recurso embebido con `!left`. Si PostgREST pelea con ese filtro, se hace una función SQL `queue_items(...)` en una migración `0001_1_queue_fn.sql` y se dice en el PR. La firma del DAL no cambia.
- Devuelve `{ items, total, unreviewedTotal, brandCount }`; el conteo de sin revisar es una segunda query `head: true`.
- `nextUnreviewedReplyId(brandSlug?)`: la más antigua sin revisar en las marcas del lead; `null` = al día.

### Página y componentes
- `page.tsx`: lee `searchParams`, sanea `status` contra la lista permitida y `page ≥ 1`, redirige specialists a `/me`, llama `listQueue`, renderiza `QueueView`.
- `QueueFilters`: chips de marca y control segmentado de estado como `<Link>` con query; sin `useState`.
- `ReviewNextButton`: `<form action={goNext}>`; la server action llama `nextUnreviewedReplyId` y hace `redirect('/reviews/'+id)` o `redirect('/queue?caught_up=1')`.
- `QueueRow`: toda la fila es `<Link href="/reviews/[id]">`; a la derecha `Pill` + `SeverityDot` + check de ack.
- `loading.tsx`: 8 filas skeleton de la misma altura (`h-16`) que `QueueRow`.
- `error.tsx`: componente cliente con `reset()` → `ErrorCard "No se pudo cargar la cola"`.
- Vacíos: sin pendientes → "Estás al día." + nombres de marcas + link a `?status=reviewed`; filtro de marca vacío → "No hay respuestas de {marca} en las últimas 48 h."

## 3. Verificar a mano
- Marta: solo filas de Voltaire + Kraft&Co; contador 7 sin revisar; "Revisar siguiente" abre la 107.
- Nuria: solo Lume; 2 sin revisar.
- `/queue?brand=lume` como Marta → página forbidden. `/queue?brand=nope` → not found.
- `/queue` como Dani → cae en `/me`.
- `/queue?status=reviewed`: pills visibles; 101 con punto rojo; 102 con check de ack.
- `supabase stop` y recargar → card de error con reintentar, no página blanca.

## 4. Checklist de review
- ¿La ventana de 48 h se calcula en el servidor desde `Date.now()`?
- ¿El filtro de marca pasa por `resolveMemberBrand` **antes** del query? ¿Algún `.in('brand_id', …)` armado desde un param?
- ¿Algún `.filter()` de filas en cliente? ¿Algún `useState` para filtros?
- ¿Los nombres de join en `.select()` coinciden con `database.types.ts` (sobre todo el nombre de la FK del specialist)?
- ¿La altura del skeleton es igual a la de la fila real?
