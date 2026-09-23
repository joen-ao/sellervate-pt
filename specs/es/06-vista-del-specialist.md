# 06 · Vista del specialist
Rama `feat/specialist-view` · Sin migración · Est. 25 min · Oleada 2

## 1. Producto
"Un specialist debería ver sus propios scores y lo que yo escribí. No los de todos los demás." Prueba viva del aislamiento y el loop de coaching más pequeño posible: **Entendido** marca el comentario como leído.

- Ruta `/me`: solo specialist; leads → `/queue`.
- Resumen (30 d): reviews recibidas, promedio, críticos — solo propios.
- Lista, más reciente primero: marca, fecha, pill, badge de severidad, chips, comentario completo del lead, nombre del reviewer; expandir → mensaje + respuesta.
- **Entendido** por review → `acknowledged_at`. Después: "Leído el {fecha}".
- Replies propias sin revisar no se listan.
- Fuera: responder al feedback, ver promedios de marca, ver a cualquier otra persona.

## 2. Plan técnico

### Archivos
```
lib/data/my-reviews.ts          # archivo aparte de reviews.ts para no chocar con 04
app/me/page.tsx  loading.tsx  error.tsx  actions.ts
app/me/_components/{MySummary,MyReviewCard,AckButton}.tsx
app/api/me/reviews/route.ts     # aislamiento verificable con curl
```

### DAL (`lib/data/my-reviews.ts`)
Código en `06-specialist-view.md`. Esencial:
- `listMyReviews()`: `requireRole('specialist')` → select de `reviews` con join a `profiles` (reviewer) y `replies!inner(…, brands!inner(…))` y **`.eq('replies.specialist_id', u.id)`** — la línea del aislamiento, en SQL, sobre la tabla unida. Límite 100, orden `created_at desc`. El resumen de 30 días se calcula en JS sobre ≤100 filas ya aisladas; excepción deliberada, anotar en DECISIONS.
- `acknowledgeReview(reviewId)`: `requireRole('specialist')` → update `acknowledged_at` solo si es null y la reply es mía; si no afectó filas, una lectura más para distinguir 404 / 403 / ya-reconocida (idempotente).

### Action y API
- `ackAction(formData)`: valida uuid, llama `acknowledgeReview`, `ForbiddenError` → `forbidden()`, `revalidatePath('/me')` y `/queue`.
- `GET /api/me/reviews` → `handle(() => listMyReviews())`.

### Componentes
- `MySummary`: tres stats; críticos en `--color-error` solo si > 0.
- `MyReviewCard`: header (marca, fecha, pill, badge), chips, comentario en bloque citado con nombre del reviewer, `<details>` "Ver el intercambio", footer con `AckButton` o "Leído el {fecha}".
- `AckButton`: `<form action={ackAction}>` + `useFormStatus`.
- Vacío: "Todavía no hay feedback. Cuando tu team lead revise una de tus respuestas aparece aquí."

## 3. Verificar a mano
- Dani: ve 101 (crítica, sin ack → botón), 102 (con ack → "Leído el"), 104, 105, 202, 205; **no** ve 201/203/204/206 (de Iker).
- Click Entendido en 101 → "Leído el hoy"; `/queue` como Marta muestra el check en 101.
- `curl localhost:3000/api/me/reviews -H "Cookie: app_user=$DANI" | jq '[.items[].replyId] | length'` → 6.
- Ack con el id de una review de Iker siendo Dani → 403.
- `/me` como Marta → `/queue`.

## 4. Checklist de review
- ¿`specialist_id = yo` es filtro SQL sobre la tabla unida, no un filtro JS?
- ¿`acknowledgeReview` verifica propiedad dentro/antes del update? ¿Es idempotente?
- ¿Se filtra algún agregado de marca en la página del specialist?
- ¿La ruta API reutiliza el DAL?
